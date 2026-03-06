import { LeaveStatus, ComplaintStatus } from '@smarthostel/shared';
import { Leave } from '@models/leave.model.js';
import { Complaint } from '@models/complaint.model.js';
import { Override } from '@models/override.model.js';
import { CronLog } from '@models/cron-log.model.js';

export async function getWardenDashboardStats() {
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const [
    pendingLeaves,
    nearBreachComplaints,
    breachedComplaints,
    pendingOverrides,
    lastCronRun,
  ] = await Promise.all([
    Leave.countDocuments({ status: LeaveStatus.PENDING }),
    Complaint.countDocuments({
      status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS] },
      dueAt: { $gt: now, $lte: sixHoursFromNow },
    }),
    Complaint.countDocuments({
      status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS] },
      dueAt: { $lt: now },
    }),
    Override.countDocuments({ reviewedBy: null }),
    CronLog.findOne({ jobName: 'sla-check' }).sort({ createdAt: -1 }).lean(),
  ]);

  const cronOverdue = lastCronRun
    ? Date.now() - new Date(lastCronRun.createdAt).getTime() > 20 * 60 * 1000
    : true;

  return {
    pendingLeaves,
    nearBreachComplaints,
    breachedComplaints,
    pendingOverrides,
    cronOverdue,
    lastCronRun: lastCronRun?.createdAt ?? null,
  };
}
