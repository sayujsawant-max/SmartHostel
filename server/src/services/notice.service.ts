import { Notice } from '@models/notice.model.js';
import { Notification } from '@models/notification.model.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { User } from '@models/user.model.js';
import { Role, NotificationType } from '@smarthostel/shared';
import { cacheGet, cacheSet, cacheDelPattern } from '@config/cache.js';
import { logger } from '@utils/logger.js';
import type mongoose from 'mongoose';

interface CreateNoticeInput {
  authorId: string;
  title: string;
  content: string;
  target: 'ALL' | 'BLOCK' | 'FLOOR';
  targetBlock?: string;
  targetFloor?: string;
}

export async function createNotice(input: CreateNoticeInput, correlationId?: string) {
  const notice = await Notice.create(input);

  // Find targeted students
  const filter: Record<string, unknown> = { role: Role.STUDENT, isActive: true };
  if (input.target === 'BLOCK' && input.targetBlock) {
    filter.block = input.targetBlock;
  } else if (input.target === 'FLOOR' && input.targetBlock && input.targetFloor) {
    filter.block = input.targetBlock;
    filter.floor = input.targetFloor;
  }

  const students = await User.find(filter).select('_id').lean();

  // Create notifications for all targeted students
  if (students.length > 0) {
    const notifications = students.map((s) => ({
      recipientId: s._id as mongoose.Types.ObjectId,
      type: NotificationType.NOTICE_PUBLISHED,
      entityType: 'Notice',
      entityId: notice._id as mongoose.Types.ObjectId,
      title: `Notice: ${input.title}`,
      body: input.content.slice(0, 200),
      isRead: false,
    }));
    await Notification.insertMany(notifications);
  }

  await AuditEvent.create({
    entityType: 'Notice',
    entityId: notice._id,
    eventType: 'NOTICE_CREATED',
    actorId: input.authorId,
    actorRole: Role.WARDEN_ADMIN,
    metadata: { title: input.title, target: input.target, targetBlock: input.targetBlock, targetFloor: input.targetFloor },
    correlationId: correlationId ?? '',
  });

  logger.info({ eventType: 'NOTICE_CREATED', correlationId, noticeId: notice._id.toString() }, 'Notice created');

  await cacheDelPattern('notices:*');
  return notice;
}

export async function getNotices(activeOnly = true) {
  const cacheKey = `notices:${activeOnly ? 'active' : 'all'}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const filter: Record<string, unknown> = {};
  if (activeOnly) filter.isActive = true;
  const notices = await Notice.find(filter)
    .sort({ createdAt: -1 })
    .populate('authorId', 'name')
    .lean();

  await cacheSet(cacheKey, notices, 60); // 1 minute TTL
  return notices;
}

export async function getStudentNotices(block?: string, floor?: string) {
  const notices = await Notice.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name')
    .lean();

  // Filter notices visible to this student
  return notices.filter((n) => {
    if (n.target === 'ALL') return true;
    if (n.target === 'BLOCK' && n.targetBlock === block) return true;
    if (n.target === 'FLOOR' && n.targetBlock === block && n.targetFloor === floor) return true;
    return false;
  });
}

export async function deactivateNotice(noticeId: string, actorId?: string, correlationId?: string) {
  const result = await Notice.findByIdAndUpdate(noticeId, { isActive: false }, { returnDocument: 'after' });

  if (result) {
    await AuditEvent.create({
      entityType: 'Notice',
      entityId: result._id,
      eventType: 'NOTICE_DEACTIVATED',
      actorId: actorId ?? null,
      actorRole: 'WARDEN_ADMIN',
      metadata: { title: result.title },
      correlationId: correlationId ?? '',
    });

    logger.info({ eventType: 'NOTICE_DEACTIVATED', correlationId, noticeId }, 'Notice deactivated');
  }

  await cacheDelPattern('notices:*');
  return result;
}
