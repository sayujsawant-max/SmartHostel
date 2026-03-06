import { ComplaintStatus, NotificationType, Role } from '@smarthostel/shared';
import { Complaint } from '@models/complaint.model.js';
import { ComplaintEvent } from '@models/complaint-event.model.js';
import { Notification } from '@models/notification.model.js';
import { CronLog } from '@models/cron-log.model.js';
import { logger } from '@utils/logger.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function runSlaCheck() {
  const now = new Date();
  let complaintsReminded = 0;
  let complaintsEscalated = 0;
  const errors: string[] = [];

  try {
    // 1. Find complaints near breach (dueAt within 2 hours, not yet reminded this cycle)
    const nearBreach = await Complaint.find({
      status: { $in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS] },
      dueAt: { $gt: now, $lte: new Date(now.getTime() + TWO_HOURS_MS) },
      escalatedAt: null,
    }).populate('assigneeId', 'name');

    // Batch reminders where possible
    if (nearBreach.length > 0) {
      // Group by assignee for batching
      const byAssignee = new Map<string, typeof nearBreach>();
      for (const c of nearBreach) {
        const assigneeId = c.assigneeId?.toString() ?? 'unassigned';
        const list = byAssignee.get(assigneeId) ?? [];
        list.push(c);
        byAssignee.set(assigneeId, list);
      }

      for (const [assigneeId, complaints] of byAssignee) {
        if (assigneeId === 'unassigned') continue;
        try {
          if (complaints.length === 1) {
            await Notification.create({
              recipientId: assigneeId,
              type: NotificationType.SLA_REMINDER,
              entityType: 'Complaint',
              entityId: complaints[0]._id,
              title: 'SLA Reminder',
              body: `${complaints[0].category} complaint is due soon.`,
            });
          } else {
            await Notification.create({
              recipientId: assigneeId,
              type: NotificationType.SLA_REMINDER,
              entityType: 'Complaint',
              entityId: complaints[0]._id,
              title: 'SLA Reminder',
              body: `${complaints.length} items due in 2h.`,
            });
          }

          for (const c of complaints) {
            await ComplaintEvent.create({
              complaintId: c._id,
              eventType: 'SLA_REMINDER',
              actorId: null,
              actorRole: 'SYSTEM',
              note: `Reminder sent to assigned staff`,
            });
          }

          complaintsReminded += complaints.length;
        } catch (err) {
          errors.push(`Reminder error for assignee ${assigneeId}: ${(err as Error).message}`);
        }
      }
    }

    // 2. Find breached complaints (dueAt has passed, not yet escalated)
    const breached = await Complaint.find({
      status: { $in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS] },
      dueAt: { $lt: now },
      escalatedAt: null,
    });

    for (const complaint of breached) {
      try {
        complaint.priority = 'CRITICAL';
        complaint.escalatedAt = now;
        complaint.escalationLevel = (complaint.escalationLevel ?? 0) + 1;
        // dueAt is NOT reset — breach persists for accountability
        await complaint.save();

        await ComplaintEvent.create({
          complaintId: complaint._id,
          eventType: 'SLA_BREACHED',
          actorId: null,
          actorRole: 'SYSTEM',
          note: `Escalated — priority raised to CRITICAL. Warden notified.`,
        });

        // Notify all wardens
        const { User } = await import('@models/user.model.js');
        const wardens = await User.find({ role: Role.WARDEN_ADMIN, isActive: true }, '_id').lean();
        for (const warden of wardens) {
          await Notification.create({
            recipientId: warden._id,
            type: NotificationType.SLA_BREACH,
            entityType: 'Complaint',
            entityId: complaint._id,
            title: 'SLA Breach',
            body: `${complaint.category} complaint has breached SLA. Priority escalated to CRITICAL.`,
          });
        }

        complaintsEscalated++;
      } catch (err) {
        errors.push(`Escalation error for complaint ${complaint._id}: ${(err as Error).message}`);
      }
    }

    const result = errors.length > 0 ? 'FAIL' as const : 'SUCCESS' as const;
    await CronLog.create({
      jobName: 'sla-check',
      result,
      complaintsReminded,
      complaintsEscalated,
      errorMessages: errors,
    });

    logger.info({ complaintsReminded, complaintsEscalated, errors: errors.length }, 'SLA cron check completed');
  } catch (err) {
    logger.error({ err }, 'SLA cron check failed');
    await CronLog.create({
      jobName: 'sla-check',
      result: 'FAIL',
      complaintsReminded,
      complaintsEscalated,
      errorMessages: [(err as Error).message],
    }).catch(() => {});
  }
}
