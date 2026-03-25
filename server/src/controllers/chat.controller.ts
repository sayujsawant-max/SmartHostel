import type { Request, Response } from 'express';
import { z } from 'zod';
import * as chatService from '@services/chat.service.js';
import { AppError } from '@utils/app-error.js';

const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export async function sendMessage(req: Request, res: Response) {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid message input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const message = await chatService.sendMessage(req.user!._id, parsed.data.recipientId, parsed.data.content);

  res.status(201).json({
    success: true,
    data: { message },
    correlationId: req.correlationId,
  });
}

export async function listConversations(req: Request, res: Response) {
  const conversations = await chatService.getConversations(req.user!._id);

  res.json({
    success: true,
    data: { conversations },
    correlationId: req.correlationId,
  });
}

export async function getMessages(req: Request<{ partnerId: string }>, res: Response) {
  const { partnerId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };

  const result = await chatService.getMessages(
    req.user!._id,
    partnerId,
    page ? parseInt(page, 10) : undefined,
    limit ? parseInt(limit, 10) : undefined,
  );

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function markAsRead(req: Request<{ partnerId: string }>, res: Response) {
  const { partnerId } = req.params;
  await chatService.markAsRead(req.user!._id, partnerId);

  res.json({
    success: true,
    data: { message: 'Messages marked as read' },
    correlationId: req.correlationId,
  });
}

export async function getUnreadCount(req: Request, res: Response) {
  const count = await chatService.getUnreadCount(req.user!._id);

  res.json({
    success: true,
    data: { count },
    correlationId: req.correlationId,
  });
}
