import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as assistantService from '@services/assistant.service.js';
import { AppError } from '@utils/app-error.js';
import { cacheGet, cacheSet } from '../config/cache.js';

export async function getFaqEntries(_req: Request, res: Response, next: NextFunction) {
  try {
    const cached = await cacheGet<unknown[]>('faqs:all');
    if (cached) {
      res.json({ success: true, data: { faqs: cached } });
      return;
    }

    const faqs = await assistantService.getFaqEntries();
    await cacheSet('faqs:all', faqs, 600);
    res.json({ success: true, data: { faqs } });
  } catch (err) {
    next(err);
  }
}

export async function getStudentFees(req: Request, res: Response, next: NextFunction) {
  try {
    const fees = await assistantService.getStudentFees(req.user!._id);
    res.json({ success: true, data: { fees } });
  } catch (err) {
    next(err);
  }
}

const chatSchema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .max(20)
    .default([]),
});

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue?.message ?? 'Invalid input', 400);
    }

    const reply = await assistantService.chat(req.user!._id, parsed.data);
    res.json({ success: true, data: { reply }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
}

export async function chatStream(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AppError('VALIDATION_ERROR', issue?.message ?? 'Invalid input', 400);
    }

    await assistantService.chatStream(req.user!._id, parsed.data, res);
  } catch (err) {
    next(err);
  }
}
