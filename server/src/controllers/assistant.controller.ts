import type { Request, Response, NextFunction } from 'express';
import * as assistantService from '@services/assistant.service.js';

export async function getFaqEntries(_req: Request, res: Response, next: NextFunction) {
  try {
    const faqs = await assistantService.getFaqEntries();
    res.json({ success: true, data: { faqs } });
  } catch (err) {
    next(err);
  }
}

export async function getStudentFees(req: Request, res: Response, next: NextFunction) {
  try {
    const fees = await assistantService.getStudentFees(req.user!._id);
    res.json({ success: true, data: { fees } });
  } catch (err) {
    next(err);
  }
}
