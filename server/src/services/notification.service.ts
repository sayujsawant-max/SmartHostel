import { Notification } from '@models/notification.model.js';

export async function getUserNotifications(userId: string, limit = 50) {
  return Notification.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getUnreadCount(userId: string) {
  return Notification.countDocuments({ recipientId: userId, isRead: false });
}

export async function markAsRead(notificationId: string, userId: string) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isRead: true },
    { new: true },
  );
}

export async function markAllAsRead(userId: string) {
  return Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true },
  );
}
