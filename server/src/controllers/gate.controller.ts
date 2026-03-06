import type { Request, Response } from 'express';
import * as gateService from '@services/gate.service.js';
import * as overrideService from '@services/override.service.js';
import { AppError } from '@utils/app-error.js';

interface ValidateBody {
  qrToken?: string;
  passCode?: string;
  directionOverride?: 'ENTRY' | 'EXIT';
}

export async function validate(req: Request, res: Response) {
  const { qrToken, passCode, directionOverride } = req.body as ValidateBody;

  if (!qrToken && !passCode) {
    throw new AppError('VALIDATION_ERROR', 'Either qrToken or passCode is required', 400);
  }

  const result = await gateService.verifyPass({
    qrToken,
    passCode,
    guardId: req.user!._id,
    directionOverride,
    correlationId: req.correlationId,
  });

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

interface OverrideBody {
  reason: string;
  note: string;
  method: 'MANUAL_OVERRIDE' | 'OFFLINE_OVERRIDE';
  leaveId?: string;
  gatePassId?: string;
  gateScanId?: string;
  studentId?: string;
}

export async function override(req: Request, res: Response) {
  const body = req.body as OverrideBody;

  if (!body.reason || !body.note || body.note.length < 5) {
    throw new AppError('VALIDATION_ERROR', 'Reason and note (min 5 chars) are required', 400);
  }

  const result = await overrideService.createOverride({
    ...body,
    guardId: req.user!._id,
    correlationId: req.correlationId,
  });

  res.status(201).json({
    success: true,
    data: { overrideId: result._id, verdict: 'ALLOW', scanResult: 'OVERRIDE' },
    correlationId: req.correlationId,
  });
}

export async function getOverrides(_req: Request, res: Response) {
  const overrides = await overrideService.getPendingOverrides();
  res.json({ success: true, data: overrides });
}

export async function getOverrideStats(_req: Request, res: Response) {
  const stats = await overrideService.getOverrideStats();
  res.json({ success: true, data: stats });
}

export async function reviewOverride(req: Request<{ id: string }>, res: Response) {
  const result = await overrideService.markReviewed(
    req.params.id,
    req.user!._id,
    req.correlationId,
  );

  if (!result) {
    throw new AppError('NOT_FOUND', 'Override not found', 404);
  }

  res.json({ success: true, data: result });
}

interface ReconcileBody {
  scanAttemptId: string;
  qrToken?: string;
  passCode?: string;
  scannedAt: string;
  directionOverride?: 'ENTRY' | 'EXIT';
  offlineStatus: 'OFFLINE_OVERRIDE' | 'OFFLINE_DENY_LOGGED';
  reason?: string;
}

export async function reconcile(req: Request, res: Response) {
  const body = req.body as ReconcileBody;

  if (!body.scanAttemptId || !body.offlineStatus) {
    throw new AppError('VALIDATION_ERROR', 'scanAttemptId and offlineStatus are required', 400);
  }

  const result = await gateService.reconcileOfflineScan({
    ...body,
    guardId: req.user!._id,
    correlationId: req.correlationId,
  });

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}
