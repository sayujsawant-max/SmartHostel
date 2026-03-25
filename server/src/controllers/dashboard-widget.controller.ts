import type { Request, Response, NextFunction } from 'express';
import * as widgetService from '@services/dashboard-widget.service.js';

export async function getLayout(req: Request, res: Response, next: NextFunction) {
  try {
    const layout = await widgetService.getLayout(req.user!._id);

    res.json({
      success: true,
      data: { layout },
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveLayout(req: Request, res: Response, next: NextFunction) {
  try {
    const { widgets } = req.body;
    if (!Array.isArray(widgets)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'widgets array is required' },
        correlationId: req.correlationId,
      });
      return;
    }

    const layout = await widgetService.saveLayout(req.user!._id, widgets);

    res.json({
      success: true,
      data: { layout },
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function resetLayout(req: Request, res: Response, next: NextFunction) {
  try {
    const layout = await widgetService.resetLayout(req.user!._id);

    res.json({
      success: true,
      data: { layout },
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
}
