import type { Request, Response } from 'express';
import { createLeaveSchema, Role } from '@smarthostel/shared';
import * as leaveService from '@services/leave.service.js';
import { AppError } from '@utils/app-error.js';

interface RejectBody {
  reason?: string;
}

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

export async function approveLeave(req: Request<{ id: string }>, res: Response) {
  const { leave, gatePass } = await leaveService.approveLeave(req.params.id, req.user!._id, req.correlationId);

  res.json({
    success: true,
    data: { leave, gatePass: { id: gatePass._id, passCode: gatePass.passCode, expiresAt: gatePass.expiresAt } },
    correlationId: req.correlationId,
  });
}

export async function rejectLeave(req: Request<{ id: string }>, res: Response) {
  const { reason } = req.body as RejectBody;
  const leave = await leaveService.rejectLeave(req.params.id, req.user!._id, reason, req.correlationId);

  res.json({
    success: true,
    data: { leave },
    correlationId: req.correlationId,
  });
}

export async function cancelLeave(req: Request<{ id: string }>, res: Response) {
  const leave = await leaveService.cancelLeave(req.params.id, req.user!._id, req.correlationId);

  res.json({
    success: true,
    data: { leave },
    correlationId: req.correlationId,
  });
}

export async function correctLeave(req: Request<{ id: string }>, res: Response) {
  const { reason } = req.body as { reason?: string };
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw new AppError('VALIDATION_ERROR', 'Correction reason is required (min 5 characters)', 400, {
      field: 'reason',
    });
  }

  const leave = await leaveService.correctLeave(req.params.id, req.user!._id, reason.trim(), req.correlationId);

  res.json({
    success: true,
    data: { leave },
    correlationId: req.correlationId,
  });
}
