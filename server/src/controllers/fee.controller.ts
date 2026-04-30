import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as feeService from '@services/fee.service.js';
import { AppError } from '@utils/app-error.js';

const FEE_TYPE = z.enum(['HOSTEL_FEE', 'MESS_FEE', 'MAINTENANCE_FEE']);

const issueFeeSchema = z.object({
  studentId: z.string().min(1),
  feeType: FEE_TYPE,
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  dueDate: z.string().min(1),
  semester: z.string().min(1).max(40),
  academicYear: z.string().min(1).max(20),
});

const issueAllSchema = issueFeeSchema.omit({ studentId: true });

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const students = await feeService.listStudents();
    res.json({ success: true, data: { students }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const feeType = typeof req.query.feeType === 'string' ? req.query.feeType : undefined;
    const fees = await feeService.listFees({ status, feeType });
    res.json({ success: true, data: { fees }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function issue(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = issueFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    const fee = await feeService.issueFee(parsed.data);
    res.status(201).json({ success: true, data: { fee }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function issueAll(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = issueAllSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    const count = await feeService.issueFeesToAll(parsed.data);
    res.status(201).json({ success: true, data: { issued: count }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    await feeService.deleteFee(req.params.id);
    res.json({ success: true, data: { id: req.params.id }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}
