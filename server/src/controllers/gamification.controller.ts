import type { Request, Response } from 'express';
import * as gamificationService from '@services/gamification.service.js';

export async function getStreak(req: Request, res: Response) {
  const streak = await gamificationService.getStudentStreak(req.user!._id);
  res.json({ success: true, data: streak, correlationId: req.correlationId });
}
