import type { Request, Response } from 'express';
import * as gatePassService from '@services/gate-pass.service.js';

export async function getActivePass(req: Request, res: Response) {
  const gatePass = await gatePassService.getActivePassForStudent(req.user!._id);

  res.json({
    success: true,
    data: { gatePass: gatePass ?? null },
    correlationId: req.correlationId,
  });
}

export async function generatePass(req: Request, res: Response) {
  const gatePass = await gatePassService.generatePassForStudent(
    req.user!._id,
    req.correlationId,
  );

  res.status(201).json({
    success: true,
    data: { qrToken: gatePass.qrToken, gatePass },
    correlationId: req.correlationId,
  });
}

export async function verifyToken(req: Request<{ token: string }>, res: Response) {
  const result = await gatePassService.verifyGatePassToken(req.params.token);

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}
