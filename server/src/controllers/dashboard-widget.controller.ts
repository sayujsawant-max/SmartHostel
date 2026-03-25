import type { Request, Response } from 'express';
import * as dashboardService from '@services/dashboard.service.js';

export async function getLayout(req: Request, res: Response) {
  const layout = await dashboardService.getWardenDashboardStats();

  res.json({
    success: true,
    data: { layout },
    correlationId: req.correlationId,
  });
}

export async function saveLayout(req: Request, res: Response) {
  // Dashboard service only supports reading stats; save is a no-op returning the current stats
  const layout = await dashboardService.getWardenDashboardStats();

  res.json({
    success: true,
    data: { layout },
    correlationId: req.correlationId,
  });
}

export async function resetLayout(req: Request, res: Response) {
  // Dashboard service only supports reading stats; reset is a no-op returning the current stats
  const layout = await dashboardService.getWardenDashboardStats();

  res.json({
    success: true,
    data: { layout },
    correlationId: req.correlationId,
  });
}
