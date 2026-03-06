import { LeaveStatus, NotificationType } from '@smarthostel/shared';
import type { CreateLeaveInput } from '@smarthostel/shared';
import { Leave } from '@models/leave.model.js';
import { Notification } from '@models/notification.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';
import { createGatePass } from '@services/gate-pass.service.js';

export async function createLeave(studentId: string, data: CreateLeaveInput, correlationId?: string) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

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
    { new: true },
  );

  if (!leave) {
    const existing = await Leave.findById(leaveId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Leave request not found', 404);
    }
    throw new AppError('CONFLICT', `Leave is ${existing.status}, not PENDING`, 409);
  }

  await Notification.create({
    recipientId: leave.studentId,
    type: NotificationType.LEAVE_APPROVED,
    entityType: 'leave',
    entityId: leave._id,
    title: 'Leave Approved',
    body: `Your ${leave.type} leave from ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} has been approved.`,
  });

  const gatePass = await createGatePass(leave, correlationId);

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
    { new: true },
  );

  if (!leave) {
    const existing = await Leave.findById(leaveId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Leave request not found', 404);
    }
    throw new AppError('CONFLICT', `Leave is ${existing.status}, not PENDING`, 409);
  }

  await Notification.create({
    recipientId: leave.studentId,
    type: NotificationType.LEAVE_REJECTED,
    entityType: 'leave',
    entityId: leave._id,
    title: 'Leave Rejected',
    body: reason
      ? `Your leave request was rejected: ${reason}`
      : 'Your leave request was rejected.',
  });

  logger.info(
    { eventType: 'LEAVE_REJECTED', correlationId, leaveId, wardenId, reason },
    'Leave rejected',
  );

  return leave;
}
