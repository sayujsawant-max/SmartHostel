import type { Request, Response } from 'express';
import { createComplaintSchema, Role } from '@smarthostel/shared';
import * as complaintService from '@services/complaint.service.js';
import { AppError } from '@utils/app-error.js';

export async function createComplaint(req: Request, res: Response) {
  const parsed = createComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new AppError('VALIDATION_ERROR', firstIssue?.message ?? 'Invalid complaint input', 400, {
      field: firstIssue?.path[0]?.toString(),
    });
  }

  const photoUrl = (req.file as Express.Multer.File | undefined)?.path ?? null;

  const complaint = await complaintService.createComplaint(
    req.user!._id,
    parsed.data,
    photoUrl,
    req.correlationId,
  );

  res.status(201).json({
    success: true,
    data: { complaint },
    correlationId: req.correlationId,
  });
}

export async function getComplaints(req: Request, res: Response) {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;

  let complaints;
  if (req.user!.role === Role.STUDENT) {
    complaints = await complaintService.getStudentComplaints(req.user!._id);
  } else {
    complaints = await complaintService.getAllComplaints({ status: statusFilter });
  }

  res.json({
    success: true,
    data: { complaints },
    correlationId: req.correlationId,
  });
}

export async function getComplaintById(req: Request<{ id: string }>, res: Response) {
  const complaint = await complaintService.getComplaintById(req.params.id);

  res.json({
    success: true,
    data: { complaint },
    correlationId: req.correlationId,
  });
}

export async function getComplaintTimeline(req: Request<{ id: string }>, res: Response) {
  const events = await complaintService.getComplaintTimeline(req.params.id);

  res.json({
    success: true,
    data: { events },
    correlationId: req.correlationId,
  });
}
