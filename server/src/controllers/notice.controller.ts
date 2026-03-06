import type { Request, Response, NextFunction } from 'express';
import { User } from '@models/user.model.js';
import * as noticeService from '@services/notice.service.js';

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
    });

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
    const notice = await noticeService.deactivateNotice(req.params.id as string);
    if (!notice) {
      res.status(404).json({ success: false, error: 'Notice not found' });
      return;
    }
    res.json({ success: true, data: { notice } });
  } catch (err) {
    next(err);
  }
}
