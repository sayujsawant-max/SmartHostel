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
