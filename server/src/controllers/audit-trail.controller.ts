import type { Request, Response } from 'express';
import { AuditEvent } from '@models/audit-event.model.js';

export async function listAuditEvents(_req: Request, res: Response) {
  const events = await AuditEvent.find()
    .populate('actorId', 'name role')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  // Map to the shape the frontend expects
  const mapped = events.map((e) => ({
    _id: e._id,
    action: e.eventType,
    actor: e.actorId
      ? { name: (e.actorId as any).name, role: (e.actorId as any).role ?? e.actorRole }
      : null,
    targetType: e.entityType,
    targetId: String(e.entityId),
    details: (e.metadata as any)?.details ?? '',
    ip: (e.metadata as any)?.ip ?? '',
    createdAt: e.createdAt,
  }));

  res.json({
    success: true,
    data: mapped,
    correlationId: _req.correlationId,
  });
}
