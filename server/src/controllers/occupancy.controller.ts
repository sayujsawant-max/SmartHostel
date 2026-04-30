import type { Request, Response } from 'express';
import * as occupancyService from '@services/occupancy.service.js';

export async function getOverview(_req: Request, res: Response) {
  const overview = await occupancyService.getOccupancyOverview();

  res.json({
    success: true,
    data: { overview },
    correlationId: _req.correlationId,
  });
}

export async function getBlockOccupancy(_req: Request, res: Response) {
  const blocks = await occupancyService.getBlockOccupancy();

  res.json({
    success: true,
    data: { blocks },
    correlationId: _req.correlationId,
  });
}

export async function getFloorOccupancy(req: Request<{ block: string }>, res: Response) {
  const { block } = req.params;
  const floors = await occupancyService.getFloorOccupancy(block);

  res.json({
    success: true,
    data: { floors },
    correlationId: req.correlationId,
  });
}

export async function getRoomGrid(req: Request, res: Response) {
  const rooms = await occupancyService.getRoomGrid(
    req.query.block as string | undefined,
    req.query.floor as string | undefined,
  );

  res.json({
    success: true,
    data: { rooms },
    correlationId: req.correlationId,
  });
}

export async function getTimeline(req: Request, res: Response) {
  const lookbackDays = req.query.lookbackDays ? Number(req.query.lookbackDays) : undefined;
  const forecastDays = req.query.forecastDays ? Number(req.query.forecastDays) : undefined;
  const result = await occupancyService.getOccupancyTimeline({ lookbackDays, forecastDays });
  res.json({ success: true, data: result, correlationId: req.correlationId });
}
