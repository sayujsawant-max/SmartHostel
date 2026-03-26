import type { Request, Response } from 'express';
import { z } from 'zod';
import { Inspection, InspectionStatus } from '@models/inspection.model.js';
import { AppError } from '@utils/app-error.js';

const createInspectionSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  block: z.string().min(1).max(10),
  floor: z.string().optional(),
  score: z.number().min(0).max(100),
  remarks: z.string().max(2000).optional(),
  issues: z.array(z.string()).optional(),
});

export async function listInspections(_req: Request, res: Response) {
  const inspections = await Inspection.find()
    .populate('inspectedBy', 'name email')
    .sort({ date: -1 })
    .lean();

  res.json({
    success: true,
    data: inspections,
    correlationId: _req.correlationId,
  });
}

export async function createInspection(req: Request, res: Response) {
  const parsed = createInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid inspection input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const status =
    parsed.data.score >= 60
      ? InspectionStatus.COMPLETED
      : InspectionStatus.FAILED;

  const inspection = await Inspection.create({
    ...parsed.data,
    inspectedBy: req.user!._id,
    status,
    issues: parsed.data.issues ?? [],
  });

  res.status(201).json({
    success: true,
    data: inspection,
    correlationId: req.correlationId,
  });
}
