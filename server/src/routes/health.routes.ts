import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { GateScan } from '@models/gate-scan.model.js';
import { CronLog } from '@models/cron-log.model.js';
import { getWardenDashboardStats } from '@services/dashboard.service.js';

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

  const [offlinePending, offlineFailed, lastCronRun] = await Promise.all([
    GateScan.countDocuments({ reconcileStatus: 'PENDING' }),
    GateScan.countDocuments({ reconcileStatus: 'FAIL' }),
    CronLog.findOne({ jobName: 'sla-check' }).sort({ createdAt: -1 }).lean(),
  ]);

  const cronOverdue = lastCronRun
    ? Date.now() - new Date(lastCronRun.createdAt).getTime() > 20 * 60 * 1000
    : true;

  res.json({
    success: true,
    data: {
      db: {
        connected: dbState === 1,
        latencyMs: dbLatencyMs,
      },
      offlineScansPending: offlinePending,
      offlineScansFailed: offlineFailed,
      cronOverdue,
      lastCronRun: lastCronRun?.createdAt ?? null,
      uptime: process.uptime(),
    },
    correlationId: req.correlationId,
  });
});

// Warden dashboard KPIs
router.get('/admin/dashboard-stats', authMiddleware, requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const stats = await getWardenDashboardStats();
  res.json({
    success: true,
    data: stats,
    correlationId: req.correlationId,
  });
});

export default router;
