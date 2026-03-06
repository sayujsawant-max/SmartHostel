import type { Request, Response } from 'express';
import * as notificationService from '@services/notification.service.js';

export async function getNotifications(req: Request, res: Response) {
  const notifications = await notificationService.getUserNotifications(req.user!._id);
  const unreadCount = await notificationService.getUnreadCount(req.user!._id);

  res.json({
    success: true,
    data: { notifications, unreadCount },
    correlationId: req.correlationId,
  });
}

export async function markAsRead(req: Request<{ id: string }>, res: Response) {
  await notificationService.markAsRead(req.params.id, req.user!._id);

  res.json({
    success: true,
    data: { ok: true },
    correlationId: req.correlationId,
  });
}

export async function markAllAsRead(req: Request, res: Response) {
  await notificationService.markAllAsRead(req.user!._id);

  res.json({
    success: true,
    data: { ok: true },
    correlationId: req.correlationId,
  });
}
