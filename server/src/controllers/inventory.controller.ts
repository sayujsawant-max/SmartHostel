import type { Request, Response } from 'express';
import { z } from 'zod';
import * as inventoryService from '@services/inventory.service.js';
import { AppError } from '@utils/app-error.js';

const addItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0),
  unit: z.string().min(1).max(50),
  location: z.string().min(1).max(200),
});

export async function listInventory(req: Request, res: Response) {
  const items = await inventoryService.getInventory();

  res.json({
    success: true,
    data: items,
    correlationId: req.correlationId,
  });
}

export async function addInventoryItem(req: Request, res: Response) {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid inventory item input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const item = await inventoryService.addItem(parsed.data);

  res.status(201).json({
    success: true,
    data: { item },
    correlationId: req.correlationId,
  });
}
