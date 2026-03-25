import type { Request, Response } from 'express';
import * as notificationService from '@services/notification.service.js';
import { NotificationPref } from '@models/notification-pref.model.js';

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

export async function getPreferences(req: Request, res: Response) {
  let prefs = await NotificationPref.findOne({ userId: req.user!._id }).lean();
  if (!prefs) {
    prefs = await NotificationPref.create({ userId: req.user!._id });
  }
  res.json({ success: true, data: prefs, correlationId: req.correlationId });
}

export async function updatePreferences(req: Request, res: Response) {
  const allowed = ['leaveUpdates', 'complaintUpdates', 'visitorUpdates', 'notices', 'sosAlerts', 'feeReminders'];
  const updates: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof req.body[key] === 'boolean') updates[key] = req.body[key];
  }

  const prefs = await NotificationPref.findOneAndUpdate(
    { userId: req.user!._id },
    { $set: updates },
    { upsert: true, returnDocument: 'after' },
  );

  res.json({ success: true, data: prefs, correlationId: req.correlationId });
}
