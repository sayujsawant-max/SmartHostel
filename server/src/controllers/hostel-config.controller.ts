import type { Request, Response } from 'express';
import type { UpdateHostelConfigInput } from '@smarthostel/shared';
import * as hostelConfigService from '@services/hostel-config.service.js';

export async function getHostelConfig(req: Request, res: Response) {
  const config = await hostelConfigService.getConfig();
  res.json({ success: true, data: { config }, correlationId: req.correlationId });
}

export async function updateHostelConfig(
  req: Request<unknown, unknown, UpdateHostelConfigInput>,
  res: Response,
) {
  const updated = await hostelConfigService.updateConfig(req.body, req.user!._id, req.correlationId);
  res.json({ success: true, data: { config: updated }, correlationId: req.correlationId });
}
