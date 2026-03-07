import jwt from 'jsonwebtoken';
import { randomUUID, randomInt } from 'node:crypto';
import { GatePassStatus } from '@smarthostel/shared';
import { env } from '@config/env.js';
import { GatePass } from '@models/gate-pass.model.js';
import type { ILeave } from '@models/leave.model.js';
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
