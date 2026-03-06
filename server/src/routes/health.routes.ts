import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { GateScan } from '@models/gate-scan.model.js';

const router = Router();

// Basic health check (public)
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy' },
    correlationId: _req.correlationId,
  });
});

// Detailed health (warden only)
router.get('/admin/health', authMiddleware, requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const dbStart = Date.now();
  const dbState = mongoose.connection.readyState;
  let dbLatencyMs = 0;

  if (dbState === 1) {
    await mongoose.connection.db!.admin().ping();
    dbLatencyMs = Date.now() - dbStart;
  }

  const [offlinePending, offlineFailed] = await Promise.all([
    GateScan.countDocuments({ reconcileStatus: 'PENDING' }),
    GateScan.countDocuments({ reconcileStatus: 'FAIL' }),
  ]);

  res.json({
    success: true,
    data: {
      db: {
        connected: dbState === 1,
        latencyMs: dbLatencyMs,
      },
      offlineScansPending: offlinePending,
      offlineScansFailed: offlineFailed,
      uptime: process.uptime(),
    },
    correlationId: req.correlationId,
  });
});

export default router;
