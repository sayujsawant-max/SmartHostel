import type { Request, Response } from 'express';
import { createComplaintSchema, ComplaintPriority, ComplaintStatus, Role } from '@smarthostel/shared';
import * as complaintService from '@services/complaint.service.js';
import { AppError } from '@utils/app-error.js';

export async function getMaintenanceStaff(_req: Request, res: Response) {
  const staff = await complaintService.getMaintenanceStaff();
  res.json({ success: true, data: { staff }, correlationId: _req.correlationId });
}

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

export async function assignComplaint(req: Request<{ id: string }>, res: Response) {
  const { assigneeId } = req.body as { assigneeId?: string };
  if (!assigneeId) {
    throw new AppError('VALIDATION_ERROR', 'assigneeId is required', 400, { field: 'assigneeId' });
  }

  const complaint = await complaintService.assignComplaint(
    req.params.id,
    assigneeId,
    req.user!._id,
    req.correlationId,
  );

  res.json({
    success: true,
    data: { complaint },
    correlationId: req.correlationId,
  });
}

export async function updatePriority(req: Request<{ id: string }>, res: Response) {
  const { priority } = req.body as { priority?: string };
  const validPriorities = Object.values(ComplaintPriority);
  if (!priority || !validPriorities.includes(priority as ComplaintPriority)) {
    throw new AppError('VALIDATION_ERROR', `priority must be one of: ${validPriorities.join(', ')}`, 400, {
      field: 'priority',
    });
  }

  const complaint = await complaintService.updatePriority(
    req.params.id,
    priority as ComplaintPriority,
    req.user!._id,
    req.correlationId,
  );

  res.json({
    success: true,
    data: { complaint },
    correlationId: req.correlationId,
  });
}

export async function updateStatus(req: Request<{ id: string }>, res: Response) {
  const { status, resolutionNotes } = req.body as { status?: string; resolutionNotes?: string };
  const validStatuses = Object.values(ComplaintStatus);
  if (!status || !validStatuses.includes(status as ComplaintStatus)) {
    throw new AppError('VALIDATION_ERROR', `status must be one of: ${validStatuses.join(', ')}`, 400, {
      field: 'status',
    });
  }

  const complaint = await complaintService.updateStatus(
    req.params.id,
    status,
    req.user!._id,
    req.user!.role,
    resolutionNotes ?? null,
    req.correlationId,
  );

  res.json({
    success: true,
    data: { complaint },
    correlationId: req.correlationId,
  });
}

export async function getAssignedTasks(req: Request, res: Response) {
  const complaints = await complaintService.getAssignedComplaints(req.user!._id);

  res.json({
    success: true,
    data: { complaints },
    correlationId: req.correlationId,
  });
}

export async function getResolvedTasks(req: Request, res: Response) {
  const complaints = await complaintService.getResolvedComplaints(req.user!._id);

  res.json({
    success: true,
    data: { complaints },
    correlationId: req.correlationId,
  });
}
