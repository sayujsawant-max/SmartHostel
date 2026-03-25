import type { Request, Response } from 'express';
import { z } from 'zod';
import * as assetService from '@services/asset.service.js';
import { AppError } from '@utils/app-error.js';

const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  assetTag: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

const updateAssetSchema = createAssetSchema.partial();

const logMaintenanceSchema = z.object({
  description: z.string().min(1).max(2000),
  cost: z.number().min(0).optional(),
  performedAt: z.string().optional(),
});

export async function createAsset(req: Request, res: Response) {
  const parsed = createAssetSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid asset input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const asset = await assetService.createAsset(parsed.data as unknown as Parameters<typeof assetService.createAsset>[0]);

  res.status(201).json({
    success: true,
    data: { asset },
    correlationId: req.correlationId,
  });
}

export async function listAssets(req: Request, res: Response) {
  const assets = await assetService.getAssets(req.query);

  res.json({
    success: true,
    data: { assets },
    correlationId: req.correlationId,
  });
}

export async function getAssetStats(_req: Request, res: Response) {
  const stats = await assetService.getAssetStats();

  res.json({
    success: true,
    data: { stats },
    correlationId: _req.correlationId,
  });
}

export async function getAssetByTag(req: Request<{ assetTag: string }>, res: Response) {
  const { assetTag } = req.params;
  const asset = await assetService.getAssetByTag(assetTag);

  res.json({
    success: true,
    data: { asset },
    correlationId: req.correlationId,
  });
}

export async function updateAsset(req: Request<{ id: string }>, res: Response) {
  const parsed = updateAssetSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid asset input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const asset = await assetService.updateAsset(req.params.id, parsed.data as unknown as Parameters<typeof assetService.updateAsset>[1]);

  res.json({
    success: true,
    data: { asset },
    correlationId: req.correlationId,
  });
}

export async function logMaintenance(req: Request<{ id: string }>, res: Response) {
  const parsed = logMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid maintenance log input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const log = await assetService.logMaintenance(req.params.id, parsed.data.description);

  res.status(201).json({
    success: true,
    data: { log },
    correlationId: req.correlationId,
  });
}
