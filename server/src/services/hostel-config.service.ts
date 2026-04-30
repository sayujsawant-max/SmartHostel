import { DEFAULT_HOSTEL_CONFIG, Role, type UpdateHostelConfigInput } from '@smarthostel/shared';
import { HostelConfigModel, HOSTEL_CONFIG_SINGLETON_KEY, type IHostelConfig } from '@models/hostel-config.model.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function getConfig(): Promise<IHostelConfig> {
  const existing = await HostelConfigModel.findOne({ key: HOSTEL_CONFIG_SINGLETON_KEY });
  if (existing) return existing;

  const created = await HostelConfigModel.create({
    key: HOSTEL_CONFIG_SINGLETON_KEY,
    ...DEFAULT_HOSTEL_CONFIG,
  });
  logger.info({ eventType: 'HOSTEL_CONFIG_SEEDED', configId: created._id.toString() }, 'Hostel config seeded with defaults');
  return created;
}

export async function updateConfig(
  input: UpdateHostelConfigInput,
  actorId: string,
  correlationId?: string,
): Promise<IHostelConfig> {
  await getConfig();

  const set: Record<string, unknown> = { updatedBy: actorId };

  if (input.hostel) {
    for (const [k, v] of Object.entries(input.hostel)) {
      set[`hostel.${k}`] = v;
    }
  }
  if (input.branding) {
    for (const [k, v] of Object.entries(input.branding)) {
      set[`branding.${k}`] = v;
    }
  }
  if (input.features) {
    for (const [k, v] of Object.entries(input.features)) {
      set[`features.${k}`] = v;
    }
  }
  if (input.pricing) {
    for (const [k, v] of Object.entries(input.pricing)) {
      set[`pricing.${k}`] = v;
    }
  }
  if (input.roomTypes) {
    const seen = new Set<string>();
    for (const rt of input.roomTypes) {
      if (seen.has(rt.key)) {
        throw new AppError('VALIDATION_ERROR', `Duplicate room type key: ${rt.key}`, 400, { field: 'roomTypes' });
      }
      seen.add(rt.key);
    }
    set.roomTypes = input.roomTypes;
  }
  if (input.blocks) {
    const seen = new Set<string>();
    for (const b of input.blocks) {
      if (seen.has(b.name)) {
        throw new AppError('VALIDATION_ERROR', `Duplicate block name: ${b.name}`, 400, { field: 'blocks' });
      }
      seen.add(b.name);
    }
    set.blocks = input.blocks;
  }

  const updated = await HostelConfigModel.findOneAndUpdate(
    { key: HOSTEL_CONFIG_SINGLETON_KEY },
    { $set: set },
    { new: true },
  );

  if (!updated) {
    throw new AppError('NOT_FOUND', 'Hostel config not found', 404);
  }

  await AuditEvent.create({
    entityType: 'HostelConfig',
    entityId: updated._id,
    eventType: 'HOSTEL_CONFIG_UPDATED',
    actorId,
    actorRole: Role.WARDEN_ADMIN,
    metadata: { fields: Object.keys(set).filter((k) => k !== 'updatedBy') },
    correlationId: correlationId ?? '',
  });

  logger.info(
    { eventType: 'HOSTEL_CONFIG_UPDATED', correlationId, actorId, fields: Object.keys(set) },
    'Hostel config updated',
  );

  return updated;
}
