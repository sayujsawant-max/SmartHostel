import type { Request, Response } from 'express';
import * as complaintAnalyticsService from '@services/complaint-analytics.service.js';

export async function getCategoryBreakdown(req: Request, res: Response) {
  const data = await complaintAnalyticsService.getCategoryBreakdown(req.query as { start?: Date; end?: Date });

  res.json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function getTrends(req: Request, res: Response) {
  const period = (req.query.period as 'daily' | 'weekly' | 'monthly') ?? 'daily';
  const range = req.query as { start?: Date; end?: Date };
  const data = await complaintAnalyticsService.getTrends(period, range);

  res.json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function getResolutionStats(_req: Request, res: Response) {
  const data = await complaintAnalyticsService.getResolutionStats();

  res.json({
    success: true,
    data,
    correlationId: _req.correlationId,
  });
}

export async function getHotspots(_req: Request, res: Response) {
  const data = await complaintAnalyticsService.getHotspots();

  res.json({
    success: true,
    data,
    correlationId: _req.correlationId,
  });
}

export async function getPredictions(_req: Request, res: Response) {
  const data = await complaintAnalyticsService.getPredictions();

  res.json({
    success: true,
    data,
    correlationId: _req.correlationId,
  });
}
