import type { Request, Response } from 'express';
import { z } from 'zod';
import * as feedbackService from '@services/feedback.service.js';
import { AppError } from '@utils/app-error.js';

const submitFeedbackSchema = z.object({
  category: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function submitFeedback(req: Request, res: Response) {
  const parsed = submitFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid feedback input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const feedback = await feedbackService.submitFeedback({
    studentId: req.user!._id,
    category: parsed.data.category as Parameters<typeof feedbackService.submitFeedback>[0]['category'],
    rating: parsed.data.rating ?? 0,
    comment: parsed.data.message,
  });

  res.status(201).json({
    success: true,
    data: { feedback },
    correlationId: req.correlationId,
  });
}

export async function listFeedbacks(req: Request, res: Response) {
  const feedbacks = await feedbackService.getFeedbacks(req.query);

  res.json({
    success: true,
    data: { feedbacks },
    correlationId: req.correlationId,
  });
}

export async function getFeedbackStats(_req: Request, res: Response) {
  const stats = await feedbackService.getFeedbackStats();

  res.json({
    success: true,
    data: { stats },
    correlationId: _req.correlationId,
  });
}

export async function deleteFeedback(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  await feedbackService.deleteFeedback(id, req.user!._id, req.user!.role);

  res.json({
    success: true,
    data: { message: 'Feedback deleted' },
    correlationId: req.correlationId,
  });
}
