import type { Request, Response } from 'express';
import { z } from 'zod';
import * as hostelConfigAiService from '@services/hostel-config-ai.service.js';
import { AppError } from '@utils/app-error.js';

const aiChatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .default([]),
});

export async function chat(req: Request, res: Response) {
  const parsed = aiChatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const result = await hostelConfigAiService.chat(parsed.data, req.user!._id, req.correlationId);
  res.json({ success: true, data: result, correlationId: req.correlationId });
}
