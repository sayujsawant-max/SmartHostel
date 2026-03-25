import type { Request, Response } from 'express';
import { z } from 'zod';
import * as emergencyAlertService from '@services/emergency-alert.service.js';
import { AppError } from '@utils/app-error.js';

const createAlertSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedBlocks: z.array(z.string()).optional(),
});

const resolveAlertSchema = z.object({
  resolution: z.string().min(1).max(2000).optional(),
});

export async function createAlert(req: Request, res: Response) {
  const parsed = createAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid alert input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const alert = await emergencyAlertService.createAlert(
    {
      type: 'EMERGENCY',
      severity: parsed.data.severity,
      title: parsed.data.title,
      description: parsed.data.message,
      targetScope: parsed.data.affectedBlocks?.length ? 'BLOCK' : 'ALL',
      targetValue: parsed.data.affectedBlocks?.join(','),
    },
    req.user!._id,
  );

  res.status(201).json({
    success: true,
    data: { alert },
    correlationId: req.correlationId,
  });
}

export async function listAlerts(req: Request, res: Response) {
  const alerts = await emergencyAlertService.getAlerts(req.query);

  res.json({
    success: true,
    data: { alerts },
    correlationId: req.correlationId,
  });
}

export async function getActiveAlerts(_req: Request, res: Response) {
  const alerts = await emergencyAlertService.getActiveAlerts();

  res.json({
    success: true,
    data: { alerts },
    correlationId: _req.correlationId,
  });
}

export async function resolveAlert(req: Request<{ id: string }>, res: Response) {
  const parsed = resolveAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid resolution input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const alert = await emergencyAlertService.resolveAlert(req.params.id, req.user!._id);

  res.json({
    success: true,
    data: { alert },
    correlationId: req.correlationId,
  });
}
