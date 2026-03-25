import type { Request, Response, NextFunction } from 'express';
import { createRoomSchema } from '@smarthostel/shared';
import * as roomService from '@services/room.service.js';
import { AppError } from '@utils/app-error.js';
import { cacheGet, cacheSet, cacheDel } from '../config/cache.js';

export async function listRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { hostelGender, roomType, acType, block } = req.query;
    const rooms = await roomService.listRooms({
      hostelGender: hostelGender as string | undefined,
      roomType: roomType as string | undefined,
      acType: acType as string | undefined,
      block: block as string | undefined,
    });
    res.json({ success: true, data: { rooms } });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const room = await roomService.getRoomById(req.params.id);
    res.json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid room input', 400, {
        field: parsed.error.issues[0]?.path[0]?.toString(),
      });
    }
    const room = await roomService.createRoom(parsed.data, req.correlationId);
    await cacheDel('rooms:availability');
    res.status(201).json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body, req.correlationId);
    await cacheDel('rooms:availability');
    res.json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
}

export async function getAvailability(_req: Request, res: Response, next: NextFunction) {
  try {
    const cached = await cacheGet<unknown>('rooms:availability');
    if (cached) {
      res.json({ success: true, data: { availability: cached } });
      return;
    }

    const availability = await roomService.getAvailability();
    await cacheSet('rooms:availability', availability, 120);
    res.json({ success: true, data: { availability } });
  } catch (err) {
    next(err);
  }
}
