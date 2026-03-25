import type { Request, Response } from 'express';
import { z } from 'zod';
import * as wellnessService from '@services/wellness.service.js';
import { StressLevel } from '@models/wellness-check.model.js';
import { AppError } from '@utils/app-error.js';

const createWellnessCheckSchema = z.object({
  studentId: z.string().min(1),
  moodScore: z.number().int().min(1).max(10),
  stressLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  notes: z.string().max(2000).optional(),
  flags: z.array(z.string()).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
});

export async function createWellnessCheck(req: Request, res: Response) {
  const parsed = createWellnessCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid wellness check input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const check = await wellnessService.createCheck({
    studentId: parsed.data.studentId,
    checkedBy: req.user!._id,
    moodScore: parsed.data.moodScore,
    stressLevel: parsed.data.stressLevel as StressLevel,
    notes: parsed.data.notes,
    flags: parsed.data.flags,
    followUpRequired: parsed.data.followUpRequired,
    followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : undefined,
  });

  res.status(201).json({
    success: true,
    data: { check },
    correlationId: req.correlationId,
  });
}

export async function listWellnessChecks(req: Request, res: Response) {
  const checks = await wellnessService.getChecks(req.query);

  res.json({
    success: true,
    data: { checks },
    correlationId: req.correlationId,
  });
}

export async function getAtRiskStudents(_req: Request, res: Response) {
  const students = await wellnessService.getAtRiskStudents();

  res.json({
    success: true,
    data: { students },
    correlationId: _req.correlationId,
  });
}

export async function getWellnessStats(_req: Request, res: Response) {
  const stats = await wellnessService.getWellnessStats();

  res.json({
    success: true,
    data: { stats },
    correlationId: _req.correlationId,
  });
}

export async function getStudentHistory(req: Request<{ studentId: string }>, res: Response) {
  const { studentId } = req.params;
  const history = await wellnessService.getStudentHistory(studentId);

  res.json({
    success: true,
    data: { history },
    correlationId: req.correlationId,
  });
}
