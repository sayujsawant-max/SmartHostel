import jwt from 'jsonwebtoken';
import { randomUUID, randomInt } from 'node:crypto';
import { GatePassStatus, LeaveStatus } from '@smarthostel/shared';
import { env } from '@config/env.js';
import { GatePass } from '@models/gate-pass.model.js';
import { Leave, type ILeave } from '@models/leave.model.js';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function createGatePass(leave: ILeave, correlationId?: string) {
  const jti = randomUUID();
  const expiresAt = leave.endDate;
  const expiresInSeconds = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  const qrToken = jwt.sign(
    { leaveRequestId: leave._id.toString(), jti },
    env.QR_SECRET,
    { expiresIn: expiresInSeconds },
  );

  const passCode = String(randomInt(100000, 999999));

  const gatePass = await GatePass.create({
    leaveId: leave._id,
    studentId: leave.studentId,
    qrToken,
    passCode,
    jti,
    status: GatePassStatus.ACTIVE,
    expiresAt,
  });

  logger.info(
    {
      eventType: 'GATE_PASS_CREATED',
      correlationId,
      gatePassId: gatePass._id.toString(),
      leaveId: leave._id.toString(),
    },
    'Gate pass created',
  );

  return gatePass;
}

export async function getActivePassForStudent(studentId: string) {
  return GatePass.findOne({
    studentId,
    status: GatePassStatus.ACTIVE,
    expiresAt: { $gt: new Date() },
  });
}

export async function generatePassForStudent(studentId: string, correlationId?: string) {
  // Check if the student already has an active gate pass
  const existingPass = await getActivePassForStudent(studentId);
  if (existingPass) {
    return existingPass;
  }

  // Find the most recent APPROVED leave that hasn't expired
  const leave = await Leave.findOne({
    studentId,
    status: LeaveStatus.APPROVED,
    endDate: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!leave) {
    throw new AppError('NOT_FOUND', 'No approved leave found. Apply for a leave first.', 404);
  }

  // Create the gate pass using the existing createGatePass function
  return createGatePass(leave, correlationId);
}

export interface VerifyTokenResult {
  valid: boolean;
  student?: {
    name: string;
    email: string;
    block?: string;
    roomNumber?: string;
  };
  leave?: {
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string;
  };
  pass?: {
    status: string;
    lastGateState: string;
    expiresAt: string;
  };
  allowEntry: boolean;
  allowExit: boolean;
  reason?: string;
}

export async function verifyGatePassToken(token: string): Promise<VerifyTokenResult> {
  let payload: { leaveRequestId: string; jti: string };
  try {
    payload = jwt.verify(token, env.QR_SECRET) as { leaveRequestId: string; jti: string };
  } catch {
    return { valid: false, allowEntry: false, allowExit: false, reason: 'Invalid or expired token' };
  }

  const gatePass = await GatePass.findOne({ leaveId: payload.leaveRequestId, jti: payload.jti });
  if (!gatePass) {
    return { valid: false, allowEntry: false, allowExit: false, reason: 'Gate pass not found' };
  }

  const leave = await Leave.findById(payload.leaveRequestId);
  if (!leave) {
    return { valid: false, allowEntry: false, allowExit: false, reason: 'Leave record not found' };
  }

  const student = await User.findById(leave.studentId);
  if (!student) {
    return { valid: false, allowEntry: false, allowExit: false, reason: 'Student not found' };
  }

  const isExpired = gatePass.expiresAt < new Date();
  const isActive = gatePass.status === GatePassStatus.ACTIVE && !isExpired;
  const allowExit = isActive && leave.status === LeaveStatus.APPROVED;
  const allowEntry = isActive && leave.status === LeaveStatus.SCANNED_OUT;

  let reason: string | undefined;
  if (!isActive) {
    reason = isExpired ? 'Pass has expired' : `Pass status: ${gatePass.status}`;
  } else if (!allowExit && !allowEntry) {
    reason = `Leave status: ${leave.status}`;
  }

  return {
    valid: isActive,
    student: {
      name: student.name,
      email: student.email,
      block: student.block,
      roomNumber: student.roomNumber,
    },
    leave: {
      type: leave.type,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      status: leave.status,
      reason: leave.reason,
    },
    pass: {
      status: isExpired ? GatePassStatus.EXPIRED : gatePass.status,
      lastGateState: gatePass.lastGateState,
      expiresAt: gatePass.expiresAt.toISOString(),
    },
    allowEntry,
    allowExit,
    reason,
  };
}

export async function invalidatePassByLeaveId(leaveId: string, correlationId?: string) {
  const result = await GatePass.findOneAndUpdate(
    { leaveId, status: GatePassStatus.ACTIVE },
    { $set: { status: GatePassStatus.CANCELLED } },
    { returnDocument: 'after' },
  );

  if (result) {
    logger.info(
      { eventType: 'GATE_PASS_CANCELLED', correlationId, gatePassId: result._id.toString() },
      'Gate pass cancelled',
    );
  }

  return result;
}
