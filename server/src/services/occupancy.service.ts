import { Room } from '@models/room.model.js';
import { Leave } from '@models/leave.model.js';
import { User } from '@models/user.model.js';
import { LeaveStatus } from '@smarthostel/shared';

export async function getOccupancyOverview() {
  const stats = await Room.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalRooms: { $sum: 1 },
        totalBeds: { $sum: '$totalBeds' },
        occupiedBeds: { $sum: '$occupiedBeds' },
        fullyOccupied: {
          $sum: { $cond: [{ $eq: ['$totalBeds', '$occupiedBeds'] }, 1, 0] },
        },
        vacant: {
          $sum: { $cond: [{ $eq: ['$occupiedBeds', 0] }, 1, 0] },
        },
        partiallyOccupied: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$occupiedBeds', 0] }, { $lt: ['$occupiedBeds', '$totalBeds'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const inactiveCount = await Room.countDocuments({ isActive: false });

  if (stats.length === 0) {
    return {
      totalRooms: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      vacantBeds: 0,
      fullyOccupied: 0,
      vacant: 0,
      partiallyOccupied: 0,
      maintenance: inactiveCount,
      occupancyRate: 0,
    };
  }

  const s = stats[0];

  return {
    totalRooms: s.totalRooms,
    totalBeds: s.totalBeds,
    occupiedBeds: s.occupiedBeds,
    vacantBeds: s.totalBeds - s.occupiedBeds,
    fullyOccupied: s.fullyOccupied,
    vacant: s.vacant,
    partiallyOccupied: s.partiallyOccupied,
    maintenance: inactiveCount,
    occupancyRate: s.totalBeds > 0 ? Math.round((s.occupiedBeds / s.totalBeds) * 10000) / 100 : 0,
  };
}

export async function getBlockOccupancy() {
  const blocks = await Room.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$block',
        totalRooms: { $sum: 1 },
        totalBeds: { $sum: '$totalBeds' },
        occupiedBeds: { $sum: '$occupiedBeds' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return blocks.map((b) => ({
    block: b._id,
    totalRooms: b.totalRooms,
    totalBeds: b.totalBeds,
    occupiedBeds: b.occupiedBeds,
    vacantBeds: b.totalBeds - b.occupiedBeds,
    occupancyRate: b.totalBeds > 0 ? Math.round((b.occupiedBeds / b.totalBeds) * 10000) / 100 : 0,
  }));
}

export async function getFloorOccupancy(block: string) {
  const floors = await Room.aggregate([
    { $match: { block, isActive: true } },
    {
      $group: {
        _id: '$floor',
        totalRooms: { $sum: 1 },
        totalBeds: { $sum: '$totalBeds' },
        occupiedBeds: { $sum: '$occupiedBeds' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return floors.map((f) => ({
    floor: f._id,
    totalRooms: f.totalRooms,
    totalBeds: f.totalBeds,
    occupiedBeds: f.occupiedBeds,
    vacantBeds: f.totalBeds - f.occupiedBeds,
    occupancyRate: f.totalBeds > 0 ? Math.round((f.occupiedBeds / f.totalBeds) * 10000) / 100 : 0,
  }));
}

export async function getRoomGrid(block?: string, floor?: string) {
  const query: Record<string, unknown> = {};
  if (block) query.block = block;
  if (floor) query.floor = floor;

  const rooms = await Room.find(query)
    .sort({ block: 1, floor: 1, roomNumber: 1 })
    .lean();

  return rooms.map((room) => ({
    _id: room._id,
    block: room.block,
    floor: room.floor,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    acType: room.acType,
    totalBeds: room.totalBeds,
    occupiedBeds: room.occupiedBeds,
    vacantBeds: room.totalBeds - room.occupiedBeds,
    isActive: room.isActive,
    status: !room.isActive
      ? 'MAINTENANCE'
      : room.occupiedBeds >= room.totalBeds
        ? 'FULL'
        : room.occupiedBeds > 0
          ? 'PARTIAL'
          : 'VACANT',
  }));
}

/* ── Timeline + forecast ───────────────────────────────────────── */

export interface TimelinePoint {
  date: string;          // ISO YYYY-MM-DD
  present?: number;       // historical: students physically in hostel
  forecast?: number;      // future: predicted students physically in hostel
  approvedAbsent: number; // students with approved leaves overlapping this day
}

export interface TimelineSummary {
  totalStudents: number;
  todayPresent: number;
  nextWeekAvgForecast: number;
  nextMonthLow: { date: string; forecast: number } | null;
  nextMonthHigh: { date: string; forecast: number } | null;
  approvedFutureLeaves: number;
}

export interface TimelineResult {
  series: TimelinePoint[];
  summary: TimelineSummary;
  meta: { lookbackDays: number; forecastDays: number; today: string };
}

/**
 * Strip the time component so date math compares whole days. Mongo dates
 * always carry a time, so without this a 14-day window can be off by one.
 */
function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Build a daily occupancy series spanning [today − lookbackDays, today + forecastDays].
 *
 * Method:
 *  - Pull every approved leave that overlaps the window once. For each day,
 *    count how many of those leaves cover it (`approvedAbsent`).
 *  - Historical days: `present = totalStudents − approvedAbsent` (assuming a
 *    stable roster — fine for a demo; a snapshot table would be more honest).
 *  - Forecast days: take the maximum of (a) approved-future-leaves overlapping
 *    that day and (b) the same weekday's historical average absence over the
 *    lookback window. The seasonal floor stops the line from collapsing flat
 *    when no future leaves are approved yet.
 */
export async function getOccupancyTimeline(opts: {
  lookbackDays?: number;
  forecastDays?: number;
} = {}): Promise<TimelineResult> {
  const lookbackDays = Math.max(7, Math.min(opts.lookbackDays ?? 60, 180));
  const forecastDays = Math.max(7, Math.min(opts.forecastDays ?? 30, 90));

  const today = startOfDay(new Date());
  const windowStart = new Date(today.getTime() - lookbackDays * 86_400_000);
  const windowEnd = new Date(today.getTime() + forecastDays * 86_400_000);

  const [totalStudents, leaves] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    Leave.find({
      status: LeaveStatus.APPROVED,
      startDate: { $lte: windowEnd },
      endDate: { $gte: windowStart },
    })
      .select('startDate endDate')
      .lean(),
  ]);

  // Pre-compute per-day approvedAbsent counts.
  const absentByDate = new Map<string, number>();
  const totalDays = lookbackDays + forecastDays + 1;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(windowStart.getTime() + i * 86_400_000);
    absentByDate.set(isoDate(d), 0);
  }
  for (const lv of leaves) {
    const start = startOfDay(new Date(lv.startDate));
    const end = startOfDay(new Date(lv.endDate));
    const from = start < windowStart ? windowStart : start;
    const to = end > windowEnd ? windowEnd : end;
    for (let t = from.getTime(); t <= to.getTime(); t += 86_400_000) {
      const key = isoDate(new Date(t));
      absentByDate.set(key, (absentByDate.get(key) ?? 0) + 1);
    }
  }

  // Day-of-week seasonal expectation from the historical portion.
  const dowAbsent: number[][] = Array.from({ length: 7 }, () => []);
  for (let i = 0; i <= lookbackDays; i++) {
    const d = new Date(windowStart.getTime() + i * 86_400_000);
    if (d > today) break;
    dowAbsent[d.getDay()].push(absentByDate.get(isoDate(d)) ?? 0);
  }
  const dowAvg = dowAbsent.map((arr) =>
    arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length,
  );

  const series: TimelinePoint[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(windowStart.getTime() + i * 86_400_000);
    const date = isoDate(d);
    const approvedAbsent = absentByDate.get(date) ?? 0;
    const isFuture = d > today;
    if (isFuture) {
      // Forecast = totalStudents − max(approved-future-leaves, seasonal expectation).
      const seasonal = Math.round(dowAvg[d.getDay()] ?? 0);
      const expectedAbsent = Math.max(approvedAbsent, seasonal);
      series.push({
        date,
        approvedAbsent,
        forecast: Math.max(0, totalStudents - expectedAbsent),
      });
    } else {
      series.push({
        date,
        approvedAbsent,
        present: Math.max(0, totalStudents - approvedAbsent),
      });
    }
  }

  // Summary built from the forecast slice.
  const future = series.filter((p) => p.forecast !== undefined);
  const nextSeven = future.slice(0, 7);
  const nextWeekAvg =
    nextSeven.length === 0
      ? totalStudents
      : Math.round(nextSeven.reduce((s, p) => s + (p.forecast ?? 0), 0) / nextSeven.length);

  let low: TimelinePoint | null = null;
  let high: TimelinePoint | null = null;
  for (const p of future) {
    if (low === null || (p.forecast ?? Infinity) < (low.forecast ?? Infinity)) low = p;
    if (high === null || (p.forecast ?? -Infinity) > (high.forecast ?? -Infinity)) high = p;
  }

  const todayKey = isoDate(today);
  const todayPoint = series.find((p) => p.date === todayKey);
  const todayPresent = todayPoint?.present ?? totalStudents;

  const approvedFutureLeaves = await Leave.countDocuments({
    status: LeaveStatus.APPROVED,
    startDate: { $gt: today },
  });

  return {
    series,
    summary: {
      totalStudents,
      todayPresent,
      nextWeekAvgForecast: nextWeekAvg,
      nextMonthLow:
        low && low.forecast !== undefined ? { date: low.date, forecast: low.forecast } : null,
      nextMonthHigh:
        high && high.forecast !== undefined ? { date: high.date, forecast: high.forecast } : null,
      approvedFutureLeaves,
    },
    meta: { lookbackDays, forecastDays, today: todayKey },
  };
}
