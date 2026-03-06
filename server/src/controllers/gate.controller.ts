import type { Request, Response } from 'express';
import * as gateService from '@services/gate.service.js';
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
