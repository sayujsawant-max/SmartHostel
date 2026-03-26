import { EmergencyAlert, EmergencyAlertStatus, EmergencySeverity } from '@models/emergency-alert.model.js';
import { cacheGet, cacheSet, cacheDel } from '@config/cache.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function createAlert(
  data: {
    type: string;
    severity: string;
    title: string;
    description: string;
    targetScope: string;
    targetValue?: string;
  },
  userId: string,
) {
  const alert = await EmergencyAlert.create({
    ...data,
    createdBy: userId,
    status: EmergencyAlertStatus.ACTIVE,
  });

  await cacheDel('alerts:active');
  logger.info(
    { alertId: alert._id, type: data.type, severity: data.severity },
    'Emergency alert created',
  );

  return alert;
}

export async function getAlerts(filters: {
  status?: string;
  severity?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.severity) {
    query.severity = filters.severity;
  }

  const [alerts, total] = await Promise.all([
    EmergencyAlert.find(query)
      .populate('createdBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EmergencyAlert.countDocuments(query),
  ]);

  return {
    alerts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function resolveAlert(alertId: string, userId: string) {
  const alert = await EmergencyAlert.findOneAndUpdate(
    { _id: alertId, status: EmergencyAlertStatus.ACTIVE },
    {
      $set: {
        status: EmergencyAlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    },
    { returnDocument: 'after' },
  );

  if (!alert) {
    throw new AppError('CONFLICT', 'Alert is not active or does not exist', 409);
  }

  await cacheDel('alerts:active');
  logger.info({ alertId, resolvedBy: userId }, 'Emergency alert resolved');

  return alert;
}

export async function getActiveAlerts() {
  const cached = await cacheGet<any[]>('alerts:active');
  if (cached) return cached;

  const severityOrder: Record<string, number> = {
    [EmergencySeverity.CRITICAL]: 0,
    [EmergencySeverity.HIGH]: 1,
    [EmergencySeverity.MEDIUM]: 2,
    [EmergencySeverity.LOW]: 3,
  };

  const alerts = await EmergencyAlert.find({ status: EmergencyAlertStatus.ACTIVE })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // Sort by severity descending (CRITICAL first)
  alerts.sort((a, b) => {
    const aOrder = severityOrder[a.severity] ?? 99;
    const bOrder = severityOrder[b.severity] ?? 99;
    return aOrder - bOrder;
  });

  await cacheSet('alerts:active', alerts, 30); // 30s TTL
  return alerts;
}
