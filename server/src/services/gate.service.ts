import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { LeaveStatus, ScanResult, GatePassStatus } from '@smarthostel/shared';
import { env } from '@config/env.js';
import { Leave } from '@models/leave.model.js';
import { GatePass } from '@models/gate-pass.model.js';
import { GateScan } from '@models/gate-scan.model.js';
import { User } from '@models/user.model.js';
import { logger } from '@utils/logger.js';

interface VerifyInput {
  qrToken?: string;
  passCode?: string;
  guardId: string;
  directionOverride?: 'ENTRY' | 'EXIT';
  correlationId?: string;
}

interface VerifyResult {
  verdict: 'ALLOW' | 'DENY';
  scanResult: string;
  student?: { name: string; block?: string };
  leaveType?: string;
  returnBy?: string;
  reason?: string;
}

// Dedup cache: key → { result, timestamp }
const dedupeCache = new Map<string, { result: VerifyResult; timestamp: number }>();
const DEDUPE_WINDOW_MS = 2000;

function makeDedupeKey(token: string, guardId: string, direction: string): string {
  const bucket = Math.floor(Date.now() / DEDUPE_WINDOW_MS);
  return createHash('sha256').update(`${token}:${guardId}:${direction}:${bucket}`).digest('hex');
}

export async function verifyPass(input: VerifyInput): Promise<VerifyResult> {
  const startTime = Date.now();
  const method = input.qrToken ? 'QR' : 'PASSCODE';

  let gatePass;
  let leaveRequestId: string;

  if (input.qrToken) {
    // Verify QR token with QR_SECRET
    let payload: { leaveRequestId: string; jti: string };
    try {
      payload = jwt.verify(input.qrToken, env.QR_SECRET) as { leaveRequestId: string; jti: string };
    } catch {
      const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.INVALID_SIGNATURE };
      await logScan(input, result, method, null, null, null, startTime);
      return result;
    }

    leaveRequestId = payload.leaveRequestId;
    gatePass = await GatePass.findOne({ leaveId: leaveRequestId, jti: payload.jti });
  } else if (input.passCode) {
    gatePass = await GatePass.findOne({
      passCode: input.passCode,
      status: GatePassStatus.ACTIVE,
      expiresAt: { $gt: new Date() },
    });

    if (!gatePass) {
      const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.NOT_FOUND };
      await logScan(input, result, method, null, null, null, startTime);
      return result;
    }
    leaveRequestId = gatePass.leaveId.toString();
  } else {
    const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.NOT_FOUND };
    await logScan(input, result, method, null, null, null, startTime);
    return result;
  }

  if (!gatePass) {
    const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.NOT_FOUND };
    await logScan(input, result, method, leaveRequestId, null, null, startTime);
    return result;
  }

  // Check gate pass status
  if (gatePass.status === GatePassStatus.CANCELLED) {
    const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.CANCELLED };
    await logScan(input, result, method, leaveRequestId, gatePass._id.toString(), gatePass.studentId.toString(), startTime);
    return result;
  }
  if (gatePass.status === GatePassStatus.EXPIRED || gatePass.expiresAt < new Date()) {
    const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.EXPIRED };
    await logScan(input, result, method, leaveRequestId, gatePass._id.toString(), gatePass.studentId.toString(), startTime);
    return result;
  }

  // Check dedup cache
  const dedupeKey = makeDedupeKey(input.qrToken ?? input.passCode!, input.guardId, input.directionOverride ?? 'AUTO');
  const cached = dedupeCache.get(dedupeKey);
  if (cached && Date.now() - cached.timestamp < DEDUPE_WINDOW_MS) {
    return cached.result;
  }

  // Get leave and student
  const leave = await Leave.findById(leaveRequestId);
  if (!leave) {
    const result: VerifyResult = { verdict: 'DENY', scanResult: ScanResult.NOT_FOUND };
    await logScan(input, result, method, leaveRequestId, gatePass._id.toString(), gatePass.studentId.toString(), startTime);
    return result;
  }

  const student = await User.findById(leave.studentId);
  const lastGateState = gatePass.lastGateState ?? 'UNKNOWN';

  // Determine direction
  let directionDetected: 'EXIT' | 'ENTRY';
  if (leave.status === LeaveStatus.APPROVED) {
    directionDetected = 'EXIT';
  } else if (leave.status === LeaveStatus.SCANNED_OUT) {
    directionDetected = 'ENTRY';
  } else {
    // Terminal or non-scannable states
    const scanResultCode = getScanResultForStatus(leave.status);
    const result: VerifyResult = {
      verdict: 'DENY',
      scanResult: scanResultCode,
      student: student ? { name: student.name, block: student.block } : undefined,
      reason: `Leave is ${leave.status}`,
    };
    await logScan(input, result, method, leaveRequestId, gatePass._id.toString(), gatePass.studentId.toString(), startTime, null, lastGateState);
    return result;
  }

  const directionUsed = input.directionOverride ?? directionDetected;

  // Atomic state transition
  let transitionResult;
  if (directionUsed === 'EXIT') {
    transitionResult = await Leave.findOneAndUpdate(
      { _id: leaveRequestId, status: LeaveStatus.APPROVED },
      { $set: { status: LeaveStatus.SCANNED_OUT, outLoggedAt: new Date() } },
      { new: true },
    );
  } else {
    transitionResult = await Leave.findOneAndUpdate(
      { _id: leaveRequestId, status: LeaveStatus.SCANNED_OUT },
      { $set: { status: LeaveStatus.SCANNED_IN, inLoggedAt: new Date() } },
      { new: true },
    );
  }

  if (!transitionResult) {
    // Concurrent scan — check current state for idempotent response
    const current = await Leave.findById(leaveRequestId);
    const scanResultCode = current ? getScanResultForStatus(current.status) : ScanResult.NOT_FOUND;
    const result: VerifyResult = {
      verdict: 'DENY',
      scanResult: scanResultCode,
      student: student ? { name: student.name, block: student.block } : undefined,
    };
    await logScan(input, result, method, leaveRequestId, gatePass._id.toString(), gatePass.studentId.toString(), startTime, directionDetected, lastGateState);
    return result;
  }

  // Update gate pass lastGateState
  const newGateState = directionUsed === 'EXIT' ? 'OUT' : 'IN';
  await GatePass.updateOne({ _id: gatePass._id }, { $set: { lastGateState: newGateState } });

  // If SCANNED_IN, auto-complete
  if (transitionResult.status === LeaveStatus.SCANNED_IN) {
    await Leave.updateOne({ _id: leaveRequestId }, { $set: { status: LeaveStatus.COMPLETED } });
    await GatePass.updateOne({ _id: gatePass._id }, { $set: { status: GatePassStatus.USED } });
  }

  const result: VerifyResult = {
    verdict: 'ALLOW',
    scanResult: ScanResult.VALID,
    student: student ? { name: student.name, block: student.block } : undefined,
    leaveType: leave.type,
    returnBy: leave.endDate.toISOString(),
  };

  // Cache for dedup
  dedupeCache.set(dedupeKey, { result, timestamp: Date.now() });

  await logScan(input, result, method, leaveRequestId, gatePass._id.toString(), gatePass.studentId.toString(), startTime, directionDetected, lastGateState, directionUsed);

  return result;
}

interface ReconcileInput {
  scanAttemptId: string;
  qrToken?: string;
  passCode?: string;
  guardId: string;
  scannedAt: string;
  directionOverride?: 'ENTRY' | 'EXIT';
  offlineStatus: 'OFFLINE_OVERRIDE' | 'OFFLINE_DENY_LOGGED';
  reason?: string;
  correlationId?: string;
}

interface ReconcileResult {
  scanAttemptId: string;
  reconcileStatus: 'SUCCESS' | 'FAIL';
  reconcileErrorCode?: string;
}

export async function reconcileOfflineScan(input: ReconcileInput): Promise<ReconcileResult> {
  // Idempotency: check if already reconciled
  const existing = await GateScan.findOne({ scanAttemptId: input.scanAttemptId });
  if (existing && existing.reconcileStatus === 'SUCCESS') {
    return { scanAttemptId: input.scanAttemptId, reconcileStatus: 'SUCCESS' };
  }

  // If guard chose OFFLINE_DENY_LOGGED, just log it — no state transition
  if (input.offlineStatus === 'OFFLINE_DENY_LOGGED') {
    await GateScan.create({
      guardId: input.guardId,
      verdict: 'DENY',
      scanResult: ScanResult.NETWORK_UNVERIFIED,
      method: input.qrToken ? 'QR' : 'PASSCODE',
      offlineStatus: 'OFFLINE_DENY_LOGGED',
      reconcileStatus: 'SUCCESS',
      reconciledAt: new Date(),
      scanAttemptId: input.scanAttemptId,
      latencyMs: 0,
      timeoutTriggered: true,
      directionSource: 'AUTO',
      lastGateStateBeforeScan: 'UNKNOWN',
    });
    return { scanAttemptId: input.scanAttemptId, reconcileStatus: 'SUCCESS' };
  }

  // OFFLINE_OVERRIDE: attempt the actual verification now
  try {
    const result = await verifyPass({
      qrToken: input.qrToken,
      passCode: input.passCode,
      guardId: input.guardId,
      directionOverride: input.directionOverride,
      correlationId: input.correlationId,
    });

    // Update the GateScan that was just created by verifyPass
    await GateScan.findOneAndUpdate(
      { guardId: input.guardId, scanResult: result.scanResult },
      {
        $set: {
          offlineStatus: 'OFFLINE_OVERRIDE',
          reconcileStatus: result.verdict === 'ALLOW' ? 'SUCCESS' : 'FAIL',
          reconcileErrorCode: result.verdict === 'DENY' ? result.scanResult : null,
          reconciledAt: new Date(),
          scanAttemptId: input.scanAttemptId,
        },
      },
      { sort: { createdAt: -1 } },
    );

    return {
      scanAttemptId: input.scanAttemptId,
      reconcileStatus: result.verdict === 'ALLOW' ? 'SUCCESS' : 'FAIL',
      reconcileErrorCode: result.verdict === 'DENY' ? result.scanResult : undefined,
    };
  } catch {
    return {
      scanAttemptId: input.scanAttemptId,
      reconcileStatus: 'FAIL',
      reconcileErrorCode: 'RECONCILE_ERROR',
    };
  }
}

function getScanResultForStatus(status: string): string {
  switch (status) {
    case LeaveStatus.SCANNED_OUT: return ScanResult.ALREADY_SCANNED_OUT;
    case LeaveStatus.SCANNED_IN: return ScanResult.ALREADY_SCANNED_IN;
    case LeaveStatus.COMPLETED: return ScanResult.ALREADY_COMPLETED;
    case LeaveStatus.EXPIRED: return ScanResult.EXPIRED;
    case LeaveStatus.CANCELLED: return ScanResult.CANCELLED;
    default: return ScanResult.NOT_FOUND;
  }
}

async function logScan(
  input: VerifyInput,
  result: VerifyResult,
  method: 'QR' | 'PASSCODE',
  leaveId: string | null,
  gatePassId: string | null,
  studentId: string | null,
  startTime: number,
  directionDetected?: 'ENTRY' | 'EXIT' | null,
  lastGateState?: string,
  directionUsed?: 'ENTRY' | 'EXIT' | null,
) {
  const latencyMs = Date.now() - startTime;

  await GateScan.create({
    leaveId,
    gatePassId,
    guardId: input.guardId,
    studentId,
    verdict: result.verdict,
    scanResult: result.scanResult,
    method,
    directionDetected: directionDetected ?? null,
    directionUsed: directionUsed ?? directionDetected ?? null,
    directionSource: input.directionOverride ? 'MANUAL_ONE_SHOT' : 'AUTO',
    lastGateStateBeforeScan: lastGateState ?? 'UNKNOWN',
    latencyMs,
    timeoutTriggered: latencyMs > 3000,
    offlineStatus: null,
    reconcileStatus: null,
    reconcileErrorCode: null,
    reconciledAt: null,
  });

  logger.info(
    {
      eventType: 'GATE_SCAN',
      correlationId: input.correlationId,
      verdict: result.verdict,
      scanResult: result.scanResult,
      method,
      guardId: input.guardId,
      latencyMs,
    },
    'Gate scan processed',
  );
}
