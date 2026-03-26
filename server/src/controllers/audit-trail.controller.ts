import type { Request, Response } from 'express';
import { AuditEvent } from '@models/audit-event.model.js';

interface PopulatedActor {
  name: string;
  role: string;
}

export async function listAuditEvents(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    AuditEvent.find()
      .populate('actorId', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditEvent.countDocuments(),
  ]);

  // Map to the shape the frontend expects
  const mapped = events.map((e) => {
    const actor = e.actorId as unknown as PopulatedActor | null;
    const metadata = (e.metadata ?? {}) as Record<string, unknown>;

    return {
      _id: e._id,
      action: e.eventType,
      actor: actor
        ? { name: actor.name, role: actor.role ?? e.actorRole }
        : null,
      targetType: e.entityType,
      targetId: String(e.entityId),
      details: (metadata.details as string) ?? '',
      ip: (metadata.ip as string) ?? '',
      createdAt: e.createdAt,
    };
  });

  res.json({
    success: true,
    data: mapped,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    correlationId: req.correlationId,
  });
}
