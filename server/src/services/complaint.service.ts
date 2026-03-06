import type { CreateComplaintInput, ComplaintPriority } from '@smarthostel/shared';
import { ComplaintStatus, SLA_CATEGORY_DEFAULTS, NotificationType, Role } from '@smarthostel/shared';
import { Complaint } from '@models/complaint.model.js';
import { User } from '@models/user.model.js';
import { ComplaintEvent } from '@models/complaint-event.model.js';
import { AuditEvent } from '@models/audit-event.model.js';
import { Notification } from '@models/notification.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

const SLA_HOURS_BY_PRIORITY: Record<string, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 12,
};

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

export async function assignComplaint(
  complaintId: string,
  assigneeId: string,
  actorId: string,
  correlationId: string,
) {
  const complaint = await Complaint.findOneAndUpdate(
    { _id: complaintId, status: ComplaintStatus.OPEN },
    { status: ComplaintStatus.ASSIGNED, assigneeId },
    { new: true },
  );

  if (!complaint) {
    throw new AppError('CONFLICT', 'Complaint is not in OPEN status or does not exist', 409);
  }

  await ComplaintEvent.create({
    complaintId: complaint._id,
    eventType: 'COMPLAINT_ASSIGNED',
    actorId,
    actorRole: Role.WARDEN_ADMIN,
    note: `Assigned to staff ${assigneeId}`,
  });

  await AuditEvent.create({
    entityType: 'Complaint',
    entityId: complaint._id,
    eventType: 'COMPLAINT_ASSIGNED',
    actorId,
    actorRole: Role.WARDEN_ADMIN,
    metadata: { assigneeId },
    correlationId,
  });

  await Notification.create({
    recipientId: assigneeId,
    type: NotificationType.COMPLAINT_ASSIGNED,
    entityType: 'Complaint',
    entityId: complaint._id,
    title: 'New Complaint Assigned',
    body: `You have been assigned a ${complaint.category} complaint (${complaint.priority} priority).`,
  });

  logger.info({ complaintId, assigneeId, correlationId }, 'Complaint assigned');

  return complaint;
}

export async function updatePriority(
  complaintId: string,
  priority: ComplaintPriority,
  actorId: string,
  correlationId: string,
) {
  const slaHours = SLA_HOURS_BY_PRIORITY[priority] ?? 48;
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new AppError('NOT_FOUND', 'Complaint not found', 404);
  }

  const oldPriority = complaint.priority;
  complaint.priority = priority;
  complaint.dueAt = new Date(complaint.createdAt.getTime() + slaHours * 60 * 60 * 1000);
  await complaint.save();

  await ComplaintEvent.create({
    complaintId: complaint._id,
    eventType: 'PRIORITY_CHANGED',
    actorId,
    actorRole: Role.WARDEN_ADMIN,
    note: `Priority changed from ${oldPriority} to ${priority}`,
  });

  await AuditEvent.create({
    entityType: 'Complaint',
    entityId: complaint._id,
    eventType: 'PRIORITY_CHANGED',
    actorId,
    actorRole: Role.WARDEN_ADMIN,
    metadata: { oldPriority, newPriority: priority, newDueAt: complaint.dueAt },
    correlationId,
  });

  logger.info({ complaintId, oldPriority, newPriority: priority, correlationId }, 'Complaint priority updated');

  return complaint;
}

export async function getMaintenanceStaff() {
  return User.find({ role: Role.MAINTENANCE, isActive: true }, '_id name').lean();
}
