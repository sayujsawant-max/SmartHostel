import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiSuccess } from '@smarthostel/shared';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy' },
    correlationId: _req.correlationId,
  } satisfies ApiSuccess<{ status: string }>);
});

export default router;
