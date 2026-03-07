import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { GateScan } from '@models/gate-scan.model.js';
import { CronLog } from '@models/cron-log.model.js';
import { Room } from '@models/room.model.js';
import { Complaint } from '@models/complaint.model.js';
import { Leave } from '@models/leave.model.js';
import { Fee } from '@models/fee.model.js';
import { getWardenDashboardStats } from '@services/dashboard.service.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     responses:
 *       200: { description: Service is healthy }
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy' },
    correlationId: _req.correlationId,
  });
});

/**
 * @openapi
 * /admin/health:
 *   get:
 *     tags: [Health]
 *     summary: Detailed health check with DB and cron status
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Detailed health information }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
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

/**
 * @openapi
 * /admin/dashboard-stats:
 *   get:
 *     tags: [Health]
 *     summary: Warden dashboard KPI statistics
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Dashboard statistics }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/admin/dashboard-stats', authMiddleware, requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const stats = await getWardenDashboardStats();
  res.json({
    success: true,
    data: stats,
    correlationId: req.correlationId,
  });
});

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Health]
 *     summary: Aggregated analytics for warden dashboard charts
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Analytics data }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/admin/analytics', authMiddleware, requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  // --- Occupancy ---
  const roomsByBlock = await Room.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$block',
        total: { $sum: '$totalBeds' },
        occupied: { $sum: '$occupiedBeds' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalBeds = roomsByBlock.reduce((sum, b) => sum + b.total, 0);
  const occupiedBeds = roomsByBlock.reduce((sum, b) => sum + b.occupied, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 1000) / 10 : 0;

  const occupancy = {
    totalBeds,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    byBlock: roomsByBlock.map((b) => ({ block: b._id, total: b.total, occupied: b.occupied })),
  };

  // --- Complaints ---
  const [complaintsByStatus, complaintsByCategory, resolutionAgg] = await Promise.all([
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: { status: 'RESOLVED' } },
      {
        $project: {
          resolutionMs: { $subtract: ['$updatedAt', '$createdAt'] },
        },
      },
      { $group: { _id: null, avgMs: { $avg: '$resolutionMs' } } },
    ]),
  ]);

  const byStatus: Record<string, number> = {};
  for (const s of complaintsByStatus) byStatus[s._id] = s.count;

  const byCategory: Record<string, number> = {};
  for (const c of complaintsByCategory) byCategory[c._id] = c.count;

  const avgResolutionHours = resolutionAgg.length > 0
    ? Math.round(resolutionAgg[0].avgMs / (1000 * 60 * 60))
    : 0;

  const complaints = { byStatus, byCategory, avgResolutionHours };

  // --- Leaves ---
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [leavesByStatus, thisWeekCount, thisMonthCount] = await Promise.all([
    Leave.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Leave.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Leave.countDocuments({ createdAt: { $gte: startOfMonth } }),
  ]);

  const leaveByStatus: Record<string, number> = {};
  for (const l of leavesByStatus) leaveByStatus[l._id] = l.count;

  const leaves = {
    byStatus: leaveByStatus,
    thisWeek: thisWeekCount,
    thisMonth: thisMonthCount,
  };

  // --- Fees ---
  const feeAgg = await Fee.aggregate([
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
      },
    },
  ]);

  let totalCollected = 0;
  let totalPending = 0;
  for (const f of feeAgg) {
    if (f._id === 'PAID') totalCollected = f.total;
    else totalPending += f.total;
  }
  const collectionRate = (totalCollected + totalPending) > 0
    ? Math.round((totalCollected / (totalCollected + totalPending)) * 1000) / 10
    : 0;

  const fees = { totalCollected, totalPending, collectionRate };

  res.json({
    success: true,
    data: { occupancy, complaints, leaves, fees },
    correlationId: req.correlationId,
  });
});

export default router;
