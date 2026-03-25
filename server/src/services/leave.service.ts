import { LeaveStatus, NotificationType } from '@smarthostel/shared';
import type { CreateLeaveInput } from '@smarthostel/shared';
import { Leave } from '@models/leave.model.js';
import { Notification } from '@models/notification.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';
import { createGatePass, invalidatePassByLeaveId } from '@services/gate-pass.service.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { emitToUser } from '@config/socket.js';

export async function createLeave(studentId: string, data: CreateLeaveInput, correlationId?: string) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate < startDate) {
    throw new AppError('VALIDATION_ERROR', 'End date must be on or after start date', 400, { field: 'endDate' });
  }

  const overlapping = await Leave.findOne({
    studentId,
    status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });

  if (overlapping) {
    throw new AppError('CONFLICT', 'You already have an active leave overlapping this date range', 409);
  }

  const leave = await Leave.create({
    studentId,
    type: data.type,
    startDate,
    endDate,
    reason: data.reason,
    status: LeaveStatus.PENDING,
  });

  await AuditEvent.create({
    entityType: 'Leave',
    entityId: leave._id,
    eventType: 'PASS_REQUESTED',
    actorId: studentId,
    actorRole: 'STUDENT',
    metadata: { type: data.type, startDate: data.startDate, endDate: data.endDate },
    correlationId,
  });

  logger.info(
    { eventType: 'LEAVE_CREATED', correlationId, leaveId: leave._id.toString(), studentId },
    'Leave request created',
  );

  return leave;
}

export async function getStudentLeaves(studentId: string) {
  return Leave.find({ studentId }).sort({ createdAt: -1 });
}

export async function getAllLeaves(filters?: { status?: string }) {
  const query: Record<string, unknown> = {};
  if (filters?.status) {
    query.status = filters.status;
  }
  return Leave.find(query).populate('studentId', 'name email block floor roomNumber').sort({ createdAt: -1 });
}

export async function approveLeave(leaveId: string, wardenId: string, correlationId?: string) {
  const leave = await Leave.findOneAndUpdate(
    { _id: leaveId, status: LeaveStatus.PENDING },
    {
      $set: {
        status: LeaveStatus.APPROVED,
        approvedBy: wardenId,
        approvedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );

  if (!leave) {
    const existing = await Leave.findById(leaveId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Leave request not found', 404);
    }
    throw new AppError('CONFLICT', `Leave is ${existing.status}, not PENDING`, 409);
  }

  const notification = await Notification.create({
    recipientId: leave.studentId,
    type: NotificationType.LEAVE_APPROVED,
    entityType: 'leave',
    entityId: leave._id,
    title: 'Leave Approved',
    body: `Your ${leave.type} leave from ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} has been approved.`,
  });

  // Push real-time notification
  emitToUser(leave.studentId.toString(), 'notification', {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    entityType: notification.entityType,
    entityId: notification.entityId,
    createdAt: notification.createdAt,
  });

  const gatePass = await createGatePass(leave, correlationId);

  await AuditEvent.create({
    entityType: 'Leave',
    entityId: leave._id,
    eventType: 'LEAVE_APPROVED',
    actorId: wardenId,
    actorRole: 'WARDEN_ADMIN',
    metadata: { studentId: leave.studentId.toString() },
    correlationId,
  });

  logger.info(
    { eventType: 'LEAVE_APPROVED', correlationId, leaveId, wardenId },
    'Leave approved',
  );

  return { leave, gatePass };
}

export async function rejectLeave(leaveId: string, wardenId: string, reason?: string, correlationId?: string) {
  const updateFields: Record<string, unknown> = {
    status: LeaveStatus.REJECTED,
  };
  if (reason) {
    updateFields.rejectionReason = reason;
  }

  const leave = await Leave.findOneAndUpdate(
    { _id: leaveId, status: LeaveStatus.PENDING },
    { $set: updateFields },
    { returnDocument: 'after' },
  );

  if (!leave) {
    const existing = await Leave.findById(leaveId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Leave request not found', 404);
    }
    throw new AppError('CONFLICT', `Leave is ${existing.status}, not PENDING`, 409);
  }

  const notification = await Notification.create({
    recipientId: leave.studentId,
    type: NotificationType.LEAVE_REJECTED,
    entityType: 'leave',
    entityId: leave._id,
    title: 'Leave Rejected',
    body: reason
      ? `Your leave request was rejected: ${reason}`
      : 'Your leave request was rejected.',
  });

  emitToUser(leave.studentId.toString(), 'notification', {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    entityType: notification.entityType,
    entityId: notification.entityId,
    createdAt: notification.createdAt,
  });

  await AuditEvent.create({
    entityType: 'Leave',
    entityId: leave._id,
    eventType: 'LEAVE_REJECTED',
    actorId: wardenId,
    actorRole: 'WARDEN_ADMIN',
    metadata: { reason: reason ?? null },
    correlationId,
  });

  logger.info(
    { eventType: 'LEAVE_REJECTED', correlationId, leaveId, wardenId, reason },
    'Leave rejected',
  );

  return leave;
}

export async function cancelLeave(leaveId: string, studentId: string, correlationId?: string) {
  // Only PENDING or APPROVED can be cancelled
  const leave = await Leave.findOneAndUpdate(
    {
      _id: leaveId,
      studentId,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
    },
    { $set: { status: LeaveStatus.CANCELLED } },
    { returnDocument: 'after' },
  );

  if (!leave) {
    const existing = await Leave.findOne({ _id: leaveId, studentId });
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Leave request not found', 404);
    }
    if (existing.status === LeaveStatus.SCANNED_OUT) {
      throw new AppError(
        'CONFLICT',
        "Cannot cancel — you've already exited. Contact your warden for corrections.",
        409,
      );
    }
    throw new AppError('CONFLICT', `Leave is ${existing.status}, cannot be cancelled`, 409);
  }

  // If the leave was APPROVED, invalidate the associated gate pass
  if (leave.approvedBy) {
    await invalidatePassByLeaveId(leaveId, correlationId);
  }

  await AuditEvent.create({
    entityType: 'Leave',
    entityId: leave._id,
    eventType: 'LEAVE_CANCELLED',
    actorId: studentId,
    actorRole: 'STUDENT',
    metadata: { previousStatus: leave.approvedBy ? 'APPROVED' : 'PENDING' },
    correlationId,
  });

  logger.info(
    { eventType: 'LEAVE_CANCELLED', correlationId, leaveId, studentId },
    'Leave cancelled',
  );

  return leave;
}

export async function correctLeave(leaveId: string, wardenId: string, reason: string, correlationId?: string) {
  const leave = await Leave.findOneAndUpdate(
    {
      _id: leaveId,
      status: { $in: [LeaveStatus.SCANNED_OUT, LeaveStatus.SCANNED_IN] },
    },
    { $set: { status: LeaveStatus.CORRECTED } },
    { returnDocument: 'before' }, // Return the ORIGINAL document for audit trail
  );

  if (!leave) {
    const existing = await Leave.findById(leaveId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Leave request not found', 404);
    }
    throw new AppError('CONFLICT', `Leave is ${existing.status}, only SCANNED_OUT or SCANNED_IN can be corrected`, 409);
  }

  // Record audit event preserving original state
  await AuditEvent.create({
    entityType: 'leave',
    entityId: leave._id,
    eventType: 'PASS_CORRECTED',
    actorRole: 'WARDEN_ADMIN',
    actorId: wardenId,
    metadata: {
      previousStatus: leave.status,
      reason,
    },
    correlationId: correlationId ?? '',
  });

  logger.info(
    { eventType: 'PASS_CORRECTED', correlationId, leaveId, wardenId, previousStatus: leave.status, reason },
    'Leave corrected by warden',
  );

  // Return the updated leave
  const updated = await Leave.findById(leaveId);
  return updated;
}
