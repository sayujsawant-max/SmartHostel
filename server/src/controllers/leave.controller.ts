import type { Request, Response } from 'express';
import { createLeaveSchema, Role } from '@smarthostel/shared';
import * as leaveService from '@services/leave.service.js';
import { AppError } from '@utils/app-error.js';

export async function createLeave(req: Request, res: Response) {
  const parsed = createLeaveSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new AppError('VALIDATION_ERROR', firstIssue?.message ?? 'Invalid leave input', 400, {
      field: firstIssue?.path[0]?.toString(),
    });
  }

  const leave = await leaveService.createLeave(req.user!._id, parsed.data, req.correlationId);

  res.status(201).json({
    success: true,
    data: { leave },
    correlationId: req.correlationId,
  });
}

export async function getLeaves(req: Request, res: Response) {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;

  let leaves;
  if (req.user!.role === Role.STUDENT) {
    leaves = await leaveService.getStudentLeaves(req.user!._id);
  } else {
    leaves = await leaveService.getAllLeaves({ status: statusFilter });
  }

  res.json({
    success: true,
    data: { leaves },
    correlationId: req.correlationId,
  });
}
