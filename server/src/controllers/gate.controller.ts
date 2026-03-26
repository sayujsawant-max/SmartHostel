import type { Request, Response } from 'express';
import * as gateService from '@services/gate.service.js';
import * as overrideService from '@services/override.service.js';
import { AppError } from '@utils/app-error.js';
import { GateScan } from '@models/gate-scan.model.js';
import { User } from '@models/user.model.js';

interface ValidateBody {
  qrToken?: string;
  passCode?: string;
  directionOverride?: 'ENTRY' | 'EXIT';
}

export async function validate(req: Request, res: Response) {
  const { qrToken, passCode, directionOverride } = req.body as ValidateBody;

  if (!qrToken && !passCode) {
    throw new AppError('VALIDATION_ERROR', 'Either qrToken or passCode is required', 400);
  }

  const result = await gateService.verifyPass({
    qrToken,
    passCode,
    guardId: req.user!._id,
    directionOverride,
    correlationId: req.correlationId,
  });

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

interface OverrideBody {
  reason: string;
  note: string;
  method: 'MANUAL_OVERRIDE' | 'OFFLINE_OVERRIDE';
  leaveId?: string;
  gatePassId?: string;
  gateScanId?: string;
  studentId?: string;
}

export async function override(req: Request, res: Response) {
  const body = req.body as OverrideBody;

  if (!body.reason || !body.note || body.note.length < 5) {
    throw new AppError('VALIDATION_ERROR', 'Reason and note (min 5 chars) are required', 400);
  }

  const result = await overrideService.createOverride({
    ...body,
    guardId: req.user!._id,
    correlationId: req.correlationId,
  });

  res.status(201).json({
    success: true,
    data: { overrideId: result._id, verdict: 'ALLOW', scanResult: 'OVERRIDE' },
    correlationId: req.correlationId,
  });
}

export async function getOverrides(req: Request, res: Response) {
  const overrides = await overrideService.getPendingOverrides();
  res.json({ success: true, data: overrides, correlationId: req.correlationId });
}

export async function getOverrideStats(req: Request, res: Response) {
  const stats = await overrideService.getOverrideStats();
  res.json({ success: true, data: stats, correlationId: req.correlationId });
}

export async function reviewOverride(req: Request<{ id: string }>, res: Response) {
  const result = await overrideService.markReviewed(
    req.params.id,
    req.user!._id,
    req.correlationId,
  );

  if (!result) {
    throw new AppError('NOT_FOUND', 'Override not found', 404);
  }

  res.json({ success: true, data: result });
}

export async function getMyScans(req: Request, res: Response) {
  const { GateScan } = await import('@models/gate-scan.model.js');
  const scans = await GateScan.find({ studentId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(500)
    .select('createdAt verdict directionUsed')
    .lean();

  res.json({
    success: true,
    data: { scans },
    correlationId: req.correlationId,
  });
}

interface ReconcileBody {
  scanAttemptId: string;
  qrToken?: string;
  passCode?: string;
  scannedAt: string;
  directionOverride?: 'ENTRY' | 'EXIT';
  offlineStatus: 'OFFLINE_OVERRIDE' | 'OFFLINE_DENY_LOGGED';
  reason?: string;
}

export async function analytics(_req: Request, res: Response) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Aggregate today's scans
  const todayScans = await GateScan.find({ createdAt: { $gte: startOfDay } }).lean();

  const totalScans = todayScans.length;
  const allowCount = todayScans.filter((s) => s.verdict === 'ALLOW').length;
  const denyCount = todayScans.filter((s) => s.verdict === 'DENY').length;
  const offlineScans = todayScans.filter((s) => s.offlineStatus != null).length;
  const avgLatencyMs = totalScans > 0
    ? Math.round(todayScans.reduce((sum, s) => sum + (s.latencyMs || 0), 0) / totalScans)
    : 0;

  // Hourly distribution
  const hourlyMap = new Map<number, { entry: number; exit: number }>();
  for (let h = 0; h < 24; h++) hourlyMap.set(h, { entry: 0, exit: 0 });
  for (const s of todayScans) {
    const hour = new Date(s.createdAt).getHours();
    const bucket = hourlyMap.get(hour)!;
    if (s.directionUsed === 'ENTRY') bucket.entry++;
    else if (s.directionUsed === 'EXIT') bucket.exit++;
  }
  const hourlyDistribution = Array.from(hourlyMap.entries()).map(([hour, counts]) => ({
    hour,
    ...counts,
  }));

  // Peak hour
  let peakHour = 0;
  let peakTotal = 0;
  for (const h of hourlyDistribution) {
    const total = h.entry + h.exit;
    if (total > peakTotal) { peakTotal = total; peakHour = h.hour; }
  }

  // Recent denials with student names
  const denials = todayScans
    .filter((s) => s.verdict === 'DENY')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const studentIds = [...new Set(denials.filter((d) => d.studentId).map((d) => d.studentId!.toString()))];
  const students = studentIds.length > 0
    ? await User.find({ _id: { $in: studentIds } }).select('name').lean()
    : [];
  const studentMap = new Map(students.map((s) => [s._id.toString(), s.name]));

  const recentDenials = denials.map((d) => ({
    studentName: d.studentId ? (studentMap.get(d.studentId.toString()) ?? 'Unknown') : 'Unknown',
    reason: d.scanResult,
    time: d.createdAt.toISOString(),
  }));

  res.json({
    success: true,
    data: {
      totalScans,
      allowCount,
      denyCount,
      avgLatencyMs,
      hourlyDistribution,
      recentDenials,
      peakHour,
      offlineScans,
    },
    correlationId: _req.correlationId,
  });
}

export async function reconcile(req: Request, res: Response) {
  const body = req.body as ReconcileBody;

  if (!body.scanAttemptId || !body.offlineStatus) {
    throw new AppError('VALIDATION_ERROR', 'scanAttemptId and offlineStatus are required', 400);
  }

  const result = await gateService.reconcileOfflineScan({
    ...body,
    guardId: req.user!._id,
    correlationId: req.correlationId,
  });

  res.json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}
