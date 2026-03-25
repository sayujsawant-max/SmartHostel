import { Complaint } from '@models/complaint.model.js';
import { logger } from '@utils/logger.js';

function buildDateFilter(dateRange?: { start?: Date; end?: Date }) {
  if (!dateRange?.start && !dateRange?.end) return {};

  const filter: Record<string, unknown> = {};
  if (dateRange.start) filter.$gte = dateRange.start;
  if (dateRange.end) filter.$lte = dateRange.end;

  return { createdAt: filter };
}

export async function getCategoryBreakdown(dateRange?: { start?: Date; end?: Date }) {
  const matchStage = buildDateFilter(dateRange);

  const breakdown = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return breakdown.map((b) => ({
    category: b._id,
    count: b.count,
    open: b.open,
    assigned: b.assigned,
    inProgress: b.inProgress,
    resolved: b.resolved,
    closed: b.closed,
  }));
}

export async function getTrends(
  period: 'daily' | 'weekly' | 'monthly',
  range?: { start?: Date; end?: Date },
) {
  const matchStage = buildDateFilter(range);

  let dateGroupFormat: string;
  switch (period) {
    case 'daily':
      dateGroupFormat = '%Y-%m-%d';
      break;
    case 'weekly':
      dateGroupFormat = '%Y-W%V';
      break;
    case 'monthly':
      dateGroupFormat = '%Y-%m';
      break;
  }

  const trends = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateGroupFormat, date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trends.map((t) => ({
    period: t._id,
    count: t.count,
  }));
}

export async function getResolutionStats() {
  const stats = await Complaint.aggregate([
    {
      $match: {
        status: { $in: ['RESOLVED', 'CLOSED'] },
      },
    },
    {
      $project: {
        resolutionTimeMs: { $subtract: ['$updatedAt', '$createdAt'] },
        dueAt: 1,
        updatedAt: 1,
      },
    },
    {
      $group: {
        _id: null,
        averageResolutionMs: { $avg: '$resolutionTimeMs' },
        totalResolved: { $sum: 1 },
        withinSla: {
          $sum: {
            $cond: [{ $lte: ['$updatedAt', '$dueAt'] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      averageResolutionHours: 0,
      totalResolved: 0,
      slaComplianceRate: 0,
    };
  }

  const { averageResolutionMs, totalResolved, withinSla } = stats[0];

  return {
    averageResolutionHours: Math.round((averageResolutionMs / (1000 * 60 * 60)) * 100) / 100,
    totalResolved,
    slaComplianceRate: totalResolved > 0 ? Math.round((withinSla / totalResolved) * 10000) / 100 : 0,
  };
}

export async function getHotspots() {
  const hotspots = await Complaint.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $group: {
        _id: { block: '$student.block', floor: '$student.floor' },
        count: { $sum: 1 },
        categories: { $push: '$category' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  return hotspots.map((h) => {
    // Count category occurrences
    const categoryCounts: Record<string, number> = {};
    for (const cat of h.categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    return {
      block: h._id.block,
      floor: h._id.floor,
      totalComplaints: h.count,
      categoryCounts,
    };
  });
}

export async function getPredictions() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  const [firstHalf, secondHalf] = await Promise.all([
    Complaint.countDocuments({
      createdAt: { $gte: thirtyDaysAgo, $lt: fifteenDaysAgo },
    }),
    Complaint.countDocuments({
      createdAt: { $gte: fifteenDaysAgo },
    }),
  ]);

  const trend = secondHalf - firstHalf;
  const trendDirection = trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable';
  const predictedNextPeriod = Math.max(0, secondHalf + trend);

  logger.info(
    { firstHalf, secondHalf, trend, trendDirection, predictedNextPeriod },
    'Complaint prediction generated',
  );

  return {
    last30Days: firstHalf + secondHalf,
    firstHalfCount: firstHalf,
    secondHalfCount: secondHalf,
    trend,
    trendDirection,
    predictedNext15Days: predictedNextPeriod,
  };
}
