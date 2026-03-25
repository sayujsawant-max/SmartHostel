import type { Request, Response } from 'express';
import { getSmartMatches } from '@services/room-matching.service.js';

export async function getMatches(req: Request, res: Response) {
  const preferences = {
    preferredBlock: (req.query.block as string) || undefined,
    preferAC: req.query.ac === 'true',
    preferQuiet: req.query.quiet === 'true',
    budgetMax: req.query.budget ? Number(req.query.budget) : undefined,
  };

  const matches = await getSmartMatches(req.user!._id, preferences);

  res.json({
    success: true,
    data: matches,
    correlationId: req.correlationId,
  });
}
