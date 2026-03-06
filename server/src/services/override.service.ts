import { NotificationType, Role } from '@smarthostel/shared';
import { Override } from '@models/override.model.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { Notification } from '@models/notification.model.js';
import { User } from '@models/user.model.js';
import { logger } from '@utils/logger.js';

interface CreateOverrideInput {
  reason: string;
  note: string;
  method: 'MANUAL_OVERRIDE' | 'OFFLINE_OVERRIDE';
  guardId: string;
  leaveId?: string;
  gatePassId?: string;
  gateScanId?: string;
  studentId?: string;
  correlationId?: string;
}

export async function createOverride(input: CreateOverrideInput) {
  const override = await Override.create({
    leaveId: input.leaveId ?? null,
    gatePassId: input.gatePassId ?? null,
    gateScanId: input.gateScanId ?? null,
    guardId: input.guardId,
    studentId: input.studentId ?? null,
    reason: input.reason,
    note: input.note,
    method: input.method,
    correlationId: input.correlationId ?? null,
  });

  // Write audit event
  await AuditEvent.create({
    entityType: 'Override',
    entityId: override._id,
    eventType: 'SCAN_OVERRIDE_GRANTED',
    actorId: input.guardId,
    actorRole: Role.GUARD,
    metadata: {
      reason: input.reason,
      note: input.note,
      method: input.method,
      leaveId: input.leaveId,
      studentId: input.studentId,
    },
    correlationId: input.correlationId,
  });

  // Notify all wardens
  const wardens = await User.find({ role: Role.WARDEN_ADMIN, isActive: true });
  const guard = await User.findById(input.guardId);
  const guardName = guard?.name ?? 'Unknown Guard';

  await Notification.insertMany(
    wardens.map((w) => ({
      recipientId: w._id,
      type: NotificationType.OVERRIDE_ALERT,
      entityType: 'Override',
      entityId: override._id,
      title: 'Gate Override Alert',
      body: `${guardName} granted an override: ${input.reason}`,
    })),
  );

  logger.info(
    {
      eventType: 'SCAN_OVERRIDE_GRANTED',
      correlationId: input.correlationId,
      overrideId: override._id,
      guardId: input.guardId,
      reason: input.reason,
    },
    'Gate override granted',
  );

  return override;
}

export async function getOverrideStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [todayCount, hourCount, perGuard] = await Promise.all([
    Override.countDocuments({ createdAt: { $gte: startOfDay } }),
    Override.countDocuments({ createdAt: { $gte: oneHourAgo } }),
    Override.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: '$guardId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'guard',
        },
      },
      { $unwind: { path: '$guard', preserveNullAndEmptyArrays: true } },
      { $project: { guardId: '$_id', guardName: '$guard.name', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const spikeAlert = todayCount > 5 || hourCount > 3;

  return {
    today: todayCount,
    lastHour: hourCount,
    spikeAlert,
    spikeMessage: spikeAlert
      ? `Override rate above threshold (${todayCount} today / ${hourCount} this hour)`
      : null,
    perGuard,
  };
}

export async function getPendingOverrides() {
  return Override.find({ reviewedAt: null })
    .populate('guardId', 'name')
    .populate('studentId', 'name block')
    .sort({ createdAt: -1 });
}

export async function markReviewed(overrideId: string, wardenId: string, correlationId?: string) {
  const override = await Override.findByIdAndUpdate(
    overrideId,
    { $set: { reviewedBy: wardenId, reviewedAt: new Date() } },
    { new: true },
  );

  if (override) {
    await AuditEvent.create({
      entityType: 'Override',
      entityId: override._id,
      eventType: 'OVERRIDE_REVIEWED',
      actorId: wardenId,
      actorRole: Role.WARDEN_ADMIN,
      metadata: { overrideId },
      correlationId,
    });
  }

  return override;
}
