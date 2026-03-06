import type { CreateComplaintInput } from '@smarthostel/shared';
import { ComplaintStatus, SLA_CATEGORY_DEFAULTS, Role } from '@smarthostel/shared';
import { Complaint } from '@models/complaint.model.js';
import { ComplaintEvent } from '@models/complaint-event.model.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function createComplaint(
  studentId: string,
  input: CreateComplaintInput,
  photoUrl: string | null,
  correlationId: string,
) {
  const defaults = SLA_CATEGORY_DEFAULTS[input.category as keyof typeof SLA_CATEGORY_DEFAULTS];
  const dueAt = new Date(Date.now() + defaults.slaHours * 60 * 60 * 1000);

  const complaint = await Complaint.create({
    studentId,
    category: input.category,
    description: input.description,
    photoUrl,
    status: ComplaintStatus.OPEN,
    priority: defaults.priority,
    dueAt,
  });

  await ComplaintEvent.create({
    complaintId: complaint._id,
    eventType: 'COMPLAINT_CREATED',
    actorId: studentId,
    actorRole: Role.STUDENT,
    note: null,
  });

  await AuditEvent.create({
    entityType: 'Complaint',
    entityId: complaint._id,
    eventType: 'COMPLAINT_CREATED',
    actorId: studentId,
    actorRole: Role.STUDENT,
    metadata: { category: input.category, priority: defaults.priority },
    correlationId,
  });

  logger.info({ complaintId: complaint._id, correlationId }, 'Complaint created');

  return complaint;
}

export async function getStudentComplaints(studentId: string) {
  return Complaint.find({ studentId }).sort({ createdAt: -1 }).lean();
}

export async function getComplaintById(complaintId: string) {
  const complaint = await Complaint.findById(complaintId)
    .populate('studentId', 'name email block roomNumber')
    .populate('assigneeId', 'name')
    .lean();
  if (!complaint) {
    throw new AppError('NOT_FOUND', 'Complaint not found', 404);
  }
  return complaint;
}

export async function getComplaintTimeline(complaintId: string) {
  return ComplaintEvent.find({ complaintId }).sort({ createdAt: 1 }).populate('actorId', 'name').lean();
}

export async function getAllComplaints(filter?: { status?: string }) {
  const query: Record<string, unknown> = {};
  if (filter?.status) {
    query.status = filter.status;
  }
  return Complaint.find(query)
    .populate('studentId', 'name block roomNumber')
    .populate('assigneeId', 'name')
    .sort({ createdAt: -1 })
    .lean();
}
