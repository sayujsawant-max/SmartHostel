import type { Request, Response } from 'express';
import { z } from 'zod';
import * as pushService from '@services/push.service.js';
import { AppError } from '@utils/app-error.js';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const sendPushSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  targetRole: z.string().optional(),
  targetUserIds: z.array(z.string()).optional(),
});

export async function subscribe(req: Request, res: Response) {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid subscription input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  await pushService.subscribe(req.user!._id, parsed.data);

  res.status(201).json({
    success: true,
    data: { message: 'Subscribed to push notifications' },
    correlationId: req.correlationId,
  });
}

export async function unsubscribe(req: Request, res: Response) {
  const { endpoint } = req.body as { endpoint?: string };
  await pushService.unsubscribe(req.user!._id, endpoint ?? '');

  res.json({
    success: true,
    data: { message: 'Unsubscribed from push notifications' },
    correlationId: req.correlationId,
  });
}

export async function sendPush(req: Request, res: Response) {
  const parsed = sendPushSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid push notification input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const payload = { title: parsed.data.title, body: parsed.data.body };
  let result;

  if (parsed.data.targetRole) {
    result = await pushService.sendPushToRole(parsed.data.targetRole, payload);
  } else if (parsed.data.targetUserIds && parsed.data.targetUserIds.length > 0) {
    // Send to each user
    let sent = 0;
    let failed = 0;
    for (const userId of parsed.data.targetUserIds) {
      const r = await pushService.sendPushToUser(userId, payload);
      sent += r.sent;
      failed += r.failed;
    }
    result = { sent, failed };
  } else {
    result = await pushService.sendPushToAll(payload);
  }

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}
