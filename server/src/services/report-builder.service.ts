import { Complaint } from '@models/complaint.model.js';
import { Room } from '@models/room.model.js';
import { Fee } from '@models/fee.model.js';
import { Leave } from '@models/leave.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

type ReportType = 'complaints' | 'occupancy' | 'fees' | 'attendance' | 'maintenance';
type ReportFormat = 'json' | 'csv';

interface DateRange {
  start?: Date;
  end?: Date;
}

function convertToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      const str = value === null || value === undefined ? '' : String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

async function generateComplaintsReport(dateRange: DateRange) {
  const query: Record<string, unknown> = {};
  if (dateRange.start || dateRange.end) {
    const dateFilter: Record<string, unknown> = {};
    if (dateRange.start) dateFilter.$gte = dateRange.start;
    if (dateRange.end) dateFilter.$lte = dateRange.end;
    query.createdAt = dateFilter;
  }

  const complaints = await Complaint.find(query)
    .populate('studentId', 'name email block roomNumber')
    .populate('assigneeId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return complaints.map((c) => {
    const student = c.studentId as unknown as Record<string, unknown>;
    const assignee = c.assigneeId as unknown as Record<string, unknown>;

    return {
      id: String(c._id),
      category: c.category,
      description: c.description,
      status: c.status,
      priority: c.priority,
      studentName: student?.name ?? '',
      studentEmail: student?.email ?? '',
      block: student?.block ?? '',
      roomNumber: student?.roomNumber ?? '',
      assigneeName: assignee?.name ?? '',
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      dueAt: c.dueAt.toISOString(),
    };
  });
}

async function generateOccupancyReport() {
  const rooms = await Room.find({ isActive: true })
    .sort({ block: 1, floor: 1, roomNumber: 1 })
    .lean();

  return rooms.map((r) => ({
    block: r.block,
    floor: r.floor,
    roomNumber: r.roomNumber,
    roomType: r.roomType,
    acType: r.acType,
    totalBeds: r.totalBeds,
    occupiedBeds: r.occupiedBeds,
    vacantBeds: r.totalBeds - r.occupiedBeds,
    occupancyRate: r.totalBeds > 0 ? Math.round((r.occupiedBeds / r.totalBeds) * 10000) / 100 : 0,
    feePerSemester: r.feePerSemester,
  }));
}

async function generateFeesReport(dateRange: DateRange) {
  const query: Record<string, unknown> = {};
  if (dateRange.start || dateRange.end) {
    const dateFilter: Record<string, unknown> = {};
    if (dateRange.start) dateFilter.$gte = dateRange.start;
    if (dateRange.end) dateFilter.$lte = dateRange.end;
    query.createdAt = dateFilter;
  }

  const fees = await Fee.find(query)
    .populate('studentId', 'name email block roomNumber')
    .sort({ createdAt: -1 })
    .lean();

  return fees.map((f) => {
    const student = f.studentId as unknown as Record<string, unknown>;

    return {
      id: String(f._id),
      studentName: student?.name ?? '',
      studentEmail: student?.email ?? '',
      amount: (f as unknown as Record<string, unknown>).amount ?? '',
      status: (f as unknown as Record<string, unknown>).status ?? '',
      semester: (f as unknown as Record<string, unknown>).semester ?? '',
      createdAt: (f as unknown as Record<string, unknown>).createdAt
        ? new Date(String((f as unknown as Record<string, unknown>).createdAt)).toISOString()
        : '',
    };
  });
}

async function generateAttendanceReport(dateRange: DateRange) {
  const query: Record<string, unknown> = {};
  if (dateRange.start || dateRange.end) {
    const dateFilter: Record<string, unknown> = {};
    if (dateRange.start) dateFilter.$gte = dateRange.start;
    if (dateRange.end) dateFilter.$lte = dateRange.end;
    query.createdAt = dateFilter;
  }

  const leaves = await Leave.find(query)
    .populate('studentId', 'name email block roomNumber')
    .sort({ createdAt: -1 })
    .lean();

  return leaves.map((l) => {
    const student = l.studentId as unknown as Record<string, unknown>;

    return {
      id: String(l._id),
      studentName: student?.name ?? '',
      studentEmail: student?.email ?? '',
      type: (l as unknown as Record<string, unknown>).type ?? '',
      startDate: (l as unknown as Record<string, unknown>).startDate
        ? new Date(String((l as unknown as Record<string, unknown>).startDate)).toISOString()
        : '',
      endDate: (l as unknown as Record<string, unknown>).endDate
        ? new Date(String((l as unknown as Record<string, unknown>).endDate)).toISOString()
        : '',
      status: (l as unknown as Record<string, unknown>).status ?? '',
      reason: (l as unknown as Record<string, unknown>).reason ?? '',
    };
  });
}

async function generateMaintenanceReport(dateRange: DateRange) {
  const query: Record<string, unknown> = {
    category: { $in: ['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'CLEANING', 'OTHER'] },
  };
  if (dateRange.start || dateRange.end) {
    const dateFilter: Record<string, unknown> = {};
    if (dateRange.start) dateFilter.$gte = dateRange.start;
    if (dateRange.end) dateFilter.$lte = dateRange.end;
    query.createdAt = dateFilter;
  }

  const complaints = await Complaint.find(query)
    .populate('studentId', 'name block roomNumber')
    .populate('assigneeId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return complaints.map((c) => {
    const student = c.studentId as unknown as Record<string, unknown>;
    const assignee = c.assigneeId as unknown as Record<string, unknown>;

    return {
      id: String(c._id),
      category: c.category,
      description: c.description,
      status: c.status,
      priority: c.priority,
      block: student?.block ?? '',
      roomNumber: student?.roomNumber ?? '',
      assigneeName: assignee?.name ?? '',
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.status === 'RESOLVED' || c.status === 'CLOSED' ? c.updatedAt.toISOString() : '',
    };
  });
}

export async function generateReport(
  type: ReportType,
  dateRange: DateRange,
  format: ReportFormat,
) {
  let data: Record<string, unknown>[];

  switch (type) {
    case 'complaints':
      data = await generateComplaintsReport(dateRange);
      break;
    case 'occupancy':
      data = await generateOccupancyReport();
      break;
    case 'fees':
      data = await generateFeesReport(dateRange);
      break;
    case 'attendance':
      data = await generateAttendanceReport(dateRange);
      break;
    case 'maintenance':
      data = await generateMaintenanceReport(dateRange);
      break;
    default:
      throw new AppError('VALIDATION_ERROR', `Unknown report type: ${type}`, 400);
  }

  logger.info({ type, format, recordCount: data.length }, 'Report generated');

  if (format === 'csv') {
    return {
      format: 'csv' as const,
      content: convertToCsv(data),
      recordCount: data.length,
    };
  }

  return {
    format: 'json' as const,
    content: data,
    recordCount: data.length,
  };
}
