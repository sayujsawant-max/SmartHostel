import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as paymentService from '@services/payment.service.js';
import { AppError } from '@utils/app-error.js';

const createOrderSchema = z.object({
  feeId: z.string().min(1),
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    const result = await paymentService.createOrderForFee(req.user!._id, parsed.data.feeId);
    res.json({ success: true, data: result, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    const result = await paymentService.verifyPayment(req.user!._id, parsed.data);
    res.json({ success: true, data: result, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const payments = await paymentService.getStudentPaymentHistory(req.user!._id);
    res.json({ success: true, data: { payments }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function getPayable(req: Request, res: Response, next: NextFunction) {
  try {
    const fees = await paymentService.getStudentPayableFees(req.user!._id);
    res.json({ success: true, data: { fees }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}
