import type { CreateResourceInput, UpdateResourceInput } from '@smarthostel/shared';
import { Resource, type IResource } from '@models/resource.model.js';
import { ResourceBooking } from '@models/resource-booking.model.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

/* ── Resource CRUD (warden) ──────────────────────────────────── */

export async function listActiveResources() {
  return Resource.find({ isActive: true }).sort({ label: 1 }).lean();
}

export async function listAllResources() {
  return Resource.find().sort({ createdAt: -1 }).lean();
}

export async function getResourceByKey(key: string) {
  const resource = await Resource.findOne({ key: key.toUpperCase() }).lean();
  if (!resource) throw new AppError('NOT_FOUND', `Resource "${key}" not found`, 404);
  return resource;
}

export async function createResource(
  input: CreateResourceInput,
  actorId: string,
  correlationId?: string,
): Promise<IResource> {
  const key = input.key.toUpperCase();
  const existing = await Resource.findOne({ key });
  if (existing) {
    throw new AppError('CONFLICT', `Resource "${key}" already exists`, 409, { field: 'key' });
  }

  const resource = await Resource.create({
    ...input,
    key,
    allowedRoles: input.allowedRoles ?? ['STUDENT'],
    bookingWindowDays: input.bookingWindowDays ?? 14,
    isActive: input.isActive ?? true,
  });

  await AuditEvent.create({
    entityType: 'Resource',
    entityId: resource._id,
    eventType: 'RESOURCE_CREATED',
    actorId,
    actorRole: 'WARDEN_ADMIN',
    metadata: { key, label: input.label },
    correlationId: correlationId ?? '',
  });

  logger.info({ eventType: 'RESOURCE_CREATED', correlationId, key }, 'Resource created');
  return resource;
}

export async function updateResource(
  key: string,
  patch: UpdateResourceInput,
  actorId: string,
  correlationId?: string,
): Promise<IResource> {
  const resource = await Resource.findOneAndUpdate(
    { key: key.toUpperCase() },
    { $set: patch },
    { new: true, runValidators: true },
  );
  if (!resource) throw new AppError('NOT_FOUND', `Resource "${key}" not found`, 404);

  await AuditEvent.create({
    entityType: 'Resource',
    entityId: resource._id,
    eventType: 'RESOURCE_UPDATED',
    actorId,
    actorRole: 'WARDEN_ADMIN',
    metadata: { key: resource.key, fields: Object.keys(patch) },
    correlationId: correlationId ?? '',
  });

  logger.info({ eventType: 'RESOURCE_UPDATED', correlationId, key: resource.key }, 'Resource updated');
  return resource;
}

export async function deleteResource(key: string, actorId: string, correlationId?: string): Promise<void> {
  const resource = await Resource.findOneAndDelete({ key: key.toUpperCase() });
  if (!resource) throw new AppError('NOT_FOUND', `Resource "${key}" not found`, 404);

  // Soft-cancel any future confirmed bookings for this resource so users see them disappear.
  await ResourceBooking.updateMany(
    { resourceKey: resource.key, status: 'CONFIRMED', date: { $gte: startOfToday() } },
    { $set: { status: 'CANCELLED' } },
  );

  await AuditEvent.create({
    entityType: 'Resource',
    entityId: resource._id,
    eventType: 'RESOURCE_DELETED',
    actorId,
    actorRole: 'WARDEN_ADMIN',
    metadata: { key: resource.key },
    correlationId: correlationId ?? '',
  });

  logger.info({ eventType: 'RESOURCE_DELETED', correlationId, key: resource.key }, 'Resource deleted');
}

/* ── Slot generation + booking ───────────────────────────────── */

interface ResolvedSlot {
  slotIndex: number;
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  available: number;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateLocal(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Returns the slots available on a given date for a resource, with live
 * booked counts. Slots whose dayOfWeek doesn't match the requested date are
 * filtered out.
 */
export async function getSlotsForDate(key: string, dateStr: string): Promise<ResolvedSlot[]> {
  const resource = await Resource.findOne({ key: key.toUpperCase(), isActive: true }).lean();
  if (!resource) throw new AppError('NOT_FOUND', `Resource "${key}" not found or inactive`, 404);

  const date = parseDateLocal(dateStr);
  const dayOfWeek = date.getDay();

  // Build candidate slots with their original index in resource.slots[]
  const candidates = resource.slots
    .map((s, idx) => ({ slot: s, slotIndex: idx }))
    .filter((c) => c.slot.dayOfWeek === dayOfWeek);

  if (candidates.length === 0) return [];

  // Single grouped count query
  const counts = await ResourceBooking.aggregate<{ _id: number; count: number }>([
    {
      $match: {
        resourceKey: resource.key,
        date,
        status: 'CONFIRMED',
        slotIndex: { $in: candidates.map((c) => c.slotIndex) },
      },
    },
    { $group: { _id: '$slotIndex', count: { $sum: 1 } } },
  ]);
  const countByIndex = new Map(counts.map((c) => [c._id, c.count]));

  return candidates.map(({ slot, slotIndex }) => {
    const bookedCount = countByIndex.get(slotIndex) ?? 0;
    return {
      slotIndex,
      date: dateStr,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: addMinutes(slot.startTime, slot.durationMinutes),
      durationMinutes: slot.durationMinutes,
      capacity: resource.capacity,
      bookedCount,
      available: Math.max(0, resource.capacity - bookedCount),
    };
  });
}

interface BookSlotResult {
  bookingId: string;
  resourceKey: string;
  date: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
}

/**
 * Atomically book a slot. Validates: resource exists & active, role allowed,
 * date within booking window, slot belongs to that day-of-week, capacity not exceeded.
 */
export async function bookSlot(
  key: string,
  userId: string,
  userRole: string,
  input: { date: string; slotIndex: number },
  correlationId?: string,
): Promise<BookSlotResult> {
  const resource = await Resource.findOne({ key: key.toUpperCase(), isActive: true }).lean();
  if (!resource) throw new AppError('NOT_FOUND', `Resource "${key}" not found or inactive`, 404);

  if (!resource.allowedRoles.includes(userRole)) {
    throw new AppError('FORBIDDEN', 'Your role is not allowed to book this resource', 403);
  }

  const date = parseDateLocal(input.date);
  const today = startOfToday();
  if (date < today) {
    throw new AppError('VALIDATION_ERROR', 'Cannot book a slot in the past', 400, { field: 'date' });
  }

  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + resource.bookingWindowDays);
  if (date > windowEnd) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Bookings only open ${resource.bookingWindowDays} days ahead`,
      400,
      { field: 'date' },
    );
  }

  const slot = resource.slots[input.slotIndex];
  if (!slot) {
    throw new AppError('VALIDATION_ERROR', 'Slot index out of range', 400, { field: 'slotIndex' });
  }
  if (slot.dayOfWeek !== date.getDay()) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Slot does not run on the requested day of week',
      400,
      { field: 'slotIndex' },
    );
  }

  // Capacity check
  const bookedCount = await ResourceBooking.countDocuments({
    resourceKey: resource.key,
    date,
    slotIndex: input.slotIndex,
    status: 'CONFIRMED',
  });
  if (bookedCount >= resource.capacity) {
    throw new AppError('CONFLICT', 'This slot is full', 409);
  }

  // Insert booking — unique partial index protects against the same user double-booking.
  let booking;
  try {
    booking = await ResourceBooking.create({
      resourceKey: resource.key,
      userId,
      date,
      slotIndex: input.slotIndex,
      startTime: slot.startTime,
      endTime: addMinutes(slot.startTime, slot.durationMinutes),
      status: 'CONFIRMED',
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      throw new AppError('CONFLICT', 'You already have a booking for this slot', 409);
    }
    throw err;
  }

  logger.info(
    { eventType: 'RESOURCE_BOOKED', correlationId, key: resource.key, userId, slotIndex: input.slotIndex },
    'Resource slot booked',
  );

  return {
    bookingId: booking._id.toString(),
    resourceKey: resource.key,
    date: input.date,
    slotIndex: input.slotIndex,
    startTime: booking.startTime,
    endTime: booking.endTime,
  };
}

export async function cancelBooking(bookingId: string, userId: string, correlationId?: string) {
  const booking = await ResourceBooking.findById(bookingId);
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404);
  if (booking.userId.toString() !== userId) {
    throw new AppError('FORBIDDEN', 'You can only cancel your own bookings', 403);
  }
  if (booking.status === 'CANCELLED') return booking; // idempotent

  booking.status = 'CANCELLED';
  await booking.save();

  logger.info(
    { eventType: 'RESOURCE_BOOKING_CANCELLED', correlationId, bookingId, userId },
    'Resource booking cancelled',
  );
  return booking;
}

export async function listMyBookings(userId: string, includePast = false) {
  const filter: Record<string, unknown> = { userId, status: 'CONFIRMED' };
  if (!includePast) filter.date = { $gte: startOfToday() };
  return ResourceBooking.find(filter).sort({ date: 1, startTime: 1 }).lean();
}

export { startOfToday, parseDateLocal, addMinutes };
