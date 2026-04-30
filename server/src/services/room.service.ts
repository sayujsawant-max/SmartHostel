import type { CreateRoomInput } from '@smarthostel/shared';
import { Room } from '@models/room.model.js';
import * as hostelConfigService from '@services/hostel-config.service.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

async function assertRoomTypeConfigured(roomType: string, acType: string): Promise<void> {
  const config = await hostelConfigService.getConfig();
  const expectedKey = `${roomType}_${acType}`;
  const match = config.roomTypes.find((rt) => rt.key === expectedKey && rt.isActive);
  if (!match) {
    const active = config.roomTypes.filter((rt) => rt.isActive).map((rt) => rt.key);
    throw new AppError(
      'VALIDATION_ERROR',
      `Room type "${roomType}" with AC type "${acType}" is not configured. Active types: ${active.join(', ') || 'none'}`,
      400,
      { field: 'roomType' },
    );
  }
}

export interface RoomFilters {
  hostelGender?: string;
  roomType?: string;
  acType?: string;
  block?: string;
}

export async function listRooms(filters: RoomFilters) {
  const query: Record<string, unknown> = { isActive: true };
  if (filters.hostelGender) query.hostelGender = filters.hostelGender;
  if (filters.roomType) query.roomType = filters.roomType;
  if (filters.acType) query.acType = filters.acType;
  if (filters.block) query.block = filters.block;

  return Room.find(query).sort({ block: 1, floor: 1, roomNumber: 1 }).lean();
}

export async function getRoomById(id: string) {
  const room = await Room.findById(id).lean();
  if (!room) throw new AppError('NOT_FOUND', 'Room not found', 404);
  return room;
}

export async function createRoom(data: CreateRoomInput, correlationId?: string) {
  await assertRoomTypeConfigured(data.roomType, data.acType);

  const existing = await Room.findOne({ block: data.block, roomNumber: data.roomNumber });
  if (existing) throw new AppError('CONFLICT', 'Room already exists in this block', 409);

  const room = await Room.create({ ...data, occupiedBeds: 0 });

  logger.info(
    { eventType: 'ROOM_CREATED', correlationId, roomId: room._id.toString() },
    'Room created',
  );
  return room;
}

export async function updateRoom(id: string, data: Partial<CreateRoomInput> & { occupiedBeds?: number }, correlationId?: string) {
  if (data.roomType || data.acType) {
    const current = await Room.findById(id).lean();
    if (!current) throw new AppError('NOT_FOUND', 'Room not found', 404);
    await assertRoomTypeConfigured(data.roomType ?? current.roomType, data.acType ?? current.acType);
  }

  const room = await Room.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true });
  if (!room) throw new AppError('NOT_FOUND', 'Room not found', 404);

  logger.info(
    { eventType: 'ROOM_UPDATED', correlationId, roomId: id },
    'Room updated',
  );
  return room;
}

export async function getAvailability() {
  const rooms = await Room.find({ isActive: true }).lean();

  const summary = {
    totalRooms: rooms.length,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    byHostel: {} as Record<string, { total: number; occupied: number; available: number }>,
    byType: {} as Record<string, { total: number; occupied: number; available: number }>,
  };

  for (const room of rooms) {
    summary.totalBeds += room.totalBeds;
    summary.occupiedBeds += room.occupiedBeds;

    const hostelKey = room.hostelGender;
    if (!summary.byHostel[hostelKey]) summary.byHostel[hostelKey] = { total: 0, occupied: 0, available: 0 };
    summary.byHostel[hostelKey].total += room.totalBeds;
    summary.byHostel[hostelKey].occupied += room.occupiedBeds;

    const typeKey = `${room.roomType}_${room.acType}`;
    if (!summary.byType[typeKey]) summary.byType[typeKey] = { total: 0, occupied: 0, available: 0 };
    summary.byType[typeKey].total += room.totalBeds;
    summary.byType[typeKey].occupied += room.occupiedBeds;
  }

  summary.availableBeds = summary.totalBeds - summary.occupiedBeds;
  for (const k of Object.keys(summary.byHostel)) {
    summary.byHostel[k].available = summary.byHostel[k].total - summary.byHostel[k].occupied;
  }
  for (const k of Object.keys(summary.byType)) {
    summary.byType[k].available = summary.byType[k].total - summary.byType[k].occupied;
  }

  return summary;
}
