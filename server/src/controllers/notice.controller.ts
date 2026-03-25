import type { Request, Response, NextFunction } from 'express';
import { User } from '@models/user.model.js';
import * as noticeService from '@services/notice.service.js';
import { AppError } from '@utils/app-error.js';

export async function createNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, content, target, targetBlock, targetFloor } = req.body as {
      title: string;
      content: string;
      target: 'ALL' | 'BLOCK' | 'FLOOR';
      targetBlock?: string;
      targetFloor?: string;
    };

    const notice = await noticeService.createNotice({
      authorId: req.user!._id,
      title,
      content,
      target,
      targetBlock,
      targetFloor,
    }, req.correlationId);

    res.status(201).json({ success: true, data: { notice } });
  } catch (err) {
    next(err);
  }
}

export async function getNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const notices = await noticeService.getNotices();
    res.json({ success: true, data: { notices } });
  } catch (err) {
    next(err);
  }
}

export async function getStudentNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await User.findById(req.user!._id).select('block floor').lean();
    const notices = await noticeService.getStudentNotices(
      student?.block,
      student?.floor,
    );
    res.json({ success: true, data: { notices } });
  } catch (err) {
    next(err);
  }
}

export async function deactivateNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const notice = await noticeService.deactivateNotice(req.params.id as string, req.user!._id, req.correlationId);
    if (!notice) {
      throw new AppError('NOT_FOUND', 'Notice not found', 404);
    }
    res.json({ success: true, data: { notice } });
  } catch (err) {
    next(err);
  }
}
