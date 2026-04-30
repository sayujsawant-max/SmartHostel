import type { Request, Response } from 'express';
import {
  createResourceSchema,
  updateResourceSchema,
  bookSlotSchema,
} from '@smarthostel/shared';
import * as resourceService from '@services/resource.service.js';
import { AppError } from '@utils/app-error.js';

/* ── Public / authenticated read surface ─────────────────────── */

export async function listResources(_req: Request, res: Response) {
  const resources = await resourceService.listActiveResources();
  res.json({ success: true, data: { resources } });
}

export async function getResource(req: Request<{ key: string }>, res: Response) {
  const resource = await resourceService.getResourceByKey(req.params.key);
  res.json({ success: true, data: { resource } });
}

export async function getSlots(req: Request<{ key: string }>, res: Response) {
  const dateStr = req.query.date as string | undefined;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new AppError('VALIDATION_ERROR', 'date query param required (YYYY-MM-DD)', 400, { field: 'date' });
  }
  const slots = await resourceService.getSlotsForDate(req.params.key, dateStr);
  res.json({ success: true, data: { slots } });
}

/* ── Student booking surface ─────────────────────────────────── */

export async function bookSlot(req: Request<{ key: string }>, res: Response) {
  const parsed = bookSlotSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const result = await resourceService.bookSlot(
    req.params.key,
    req.user!._id,
    req.user!.role,
    parsed.data,
    req.correlationId,
  );
  res.status(201).json({ success: true, data: { booking: result }, correlationId: req.correlationId });
}

export async function cancelBooking(req: Request<{ id: string }>, res: Response) {
  const booking = await resourceService.cancelBooking(req.params.id, req.user!._id, req.correlationId);
  res.json({ success: true, data: { booking }, correlationId: req.correlationId });
}

export async function listMyBookings(req: Request, res: Response) {
  const includePast = req.query.includePast === 'true';
  const bookings = await resourceService.listMyBookings(req.user!._id, includePast);
  res.json({ success: true, data: { bookings } });
}

/* ── Warden admin surface ────────────────────────────────────── */

export async function adminListResources(_req: Request, res: Response) {
  const resources = await resourceService.listAllResources();
  res.json({ success: true, data: { resources } });
}

export async function adminCreateResource(req: Request, res: Response) {
  const parsed = createResourceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }
  const resource = await resourceService.createResource(parsed.data, req.user!._id, req.correlationId);
  res.status(201).json({ success: true, data: { resource }, correlationId: req.correlationId });
}

export async function adminUpdateResource(req: Request<{ key: string }>, res: Response) {
  const parsed = updateResourceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }
  const resource = await resourceService.updateResource(
    req.params.key,
    parsed.data,
    req.user!._id,
    req.correlationId,
  );
  res.json({ success: true, data: { resource }, correlationId: req.correlationId });
}

export async function adminDeleteResource(req: Request<{ key: string }>, res: Response) {
  await resourceService.deleteResource(req.params.key, req.user!._id, req.correlationId);
  res.json({ success: true, data: { ok: true }, correlationId: req.correlationId });
}
