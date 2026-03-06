import { LeaveStatus } from '@smarthostel/shared';
import type { CreateLeaveInput } from '@smarthostel/shared';
import { Leave } from '@models/leave.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

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
  return Leave.find(query).sort({ createdAt: -1 });
}
