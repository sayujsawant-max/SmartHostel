import webpush from 'web-push';
import { PushSubscription } from '@models/push-subscription.model.js';
import { User } from '@models/user.model.js';
import { logger } from '@utils/logger.js';

// Configure web-push VAPID keys from environment
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@smarthostel.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  logger.warn('VAPID keys not configured — push notifications will not be sent');
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function subscribe(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  const sub = await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      $set: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  logger.info({ userId, endpoint: subscription.endpoint }, 'Push subscription saved');

  return sub;
}

export async function unsubscribe(userId: string, endpoint: string) {
  const result = await PushSubscription.deleteOne({ userId, endpoint });

  if (result.deletedCount === 0) {
    logger.warn({ userId, endpoint }, 'Push subscription not found for removal');
  } else {
    logger.info({ userId, endpoint }, 'Push subscription removed');
  }

  return { removed: result.deletedCount > 0 };
}

async function sendToSubscriptions(
  subscriptions: Array<{ endpoint: string; keys: { p256dh: string; auth: string }; _id: unknown }>,
  payload: PushPayload,
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn('Skipping push notification — VAPID keys not configured');
    return { sent: 0, failed: 0 };
  }

  const payloadStr = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payloadStr,
      ),
    ),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      sent++;
    } else {
      failed++;
      // Remove expired/invalid subscriptions (410 Gone)
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await PushSubscription.deleteOne({ _id: subscriptions[i]._id as any });
        logger.info({ endpoint: subscriptions[i].endpoint }, 'Removed stale push subscription');
      } else {
        logger.error({ error: result.reason, endpoint: subscriptions[i].endpoint }, 'Push notification failed');
      }
    }
  }

  return { sent, failed };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await PushSubscription.find({ userId }).lean();

  if (subscriptions.length === 0) {
    logger.info({ userId }, 'No push subscriptions found for user');
    return { sent: 0, failed: 0 };
  }

  const result = await sendToSubscriptions(subscriptions, payload);

  logger.info({ userId, ...result }, 'Push notifications sent to user');

  return result;
}

export async function sendPushToRole(role: string, payload: PushPayload) {
  const users = await User.find({ role, isActive: true }, '_id').lean();
  const userIds = users.map((u) => u._id);

  const subscriptions = await PushSubscription.find({ userId: { $in: userIds } }).lean();

  if (subscriptions.length === 0) {
    logger.info({ role }, 'No push subscriptions found for role');
    return { sent: 0, failed: 0 };
  }

  const result = await sendToSubscriptions(subscriptions, payload);

  logger.info({ role, ...result }, 'Push notifications sent to role');

  return result;
}

export async function sendPushToAll(payload: PushPayload) {
  const subscriptions = await PushSubscription.find({}).lean();

  if (subscriptions.length === 0) {
    logger.info('No push subscriptions found');
    return { sent: 0, failed: 0 };
  }

  const result = await sendToSubscriptions(subscriptions, payload);

  logger.info({ ...result }, 'Push notifications sent to all');

  return result;
}
