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

export async function listInspections(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [inspections, total] = await Promise.all([
    Inspection.find()
      .populate('inspectedBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inspection.countDocuments(),
  ]);

  res.json({
    success: true,
    data: inspections,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    correlationId: req.correlationId,
  });
}

export async function createInspection(req: Request, res: Response) {
  const parsed = createInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid inspection input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  // Score provided at creation means inspection is already done
  const status = parsed.data.score >= 60
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
