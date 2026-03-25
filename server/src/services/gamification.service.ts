import { Leave } from '@models/leave.model.js';
import { Complaint } from '@models/complaint.model.js';
import { GateScan } from '@models/gate-scan.model.js';

export interface StreakData {
  /** Consecutive days the student returned on time */
  onTimeStreak: number;
  /** Total approved leaves */
  totalApprovedLeaves: number;
  /** Total complaints resolved */
  resolvedComplaints: number;
  /** Days since first registration (active days) */
  activeDays: number;
  /** Badges earned */
  badges: Badge[];
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
  description: string;
}

export async function getStudentStreak(studentId: string): Promise<StreakData> {
  const [approvedLeaves, resolvedComplaints, gateScans, firstLeave] = await Promise.all([
    Leave.countDocuments({ studentId, status: { $in: ['APPROVED', 'COMPLETED', 'SCANNED_IN'] } }),
    Complaint.countDocuments({ studentId, status: 'RESOLVED' }),
    GateScan.find({ studentId, verdict: 'ALLOW', directionUsed: 'ENTRY' })
      .sort({ createdAt: -1 })
      .limit(60)
      .select('createdAt')
      .lean(),
    Leave.findOne({ studentId }).sort({ createdAt: 1 }).select('createdAt').lean(),
  ]);

  // Calculate on-time streak: consecutive days with an ENTRY scan (returned to hostel)
  let onTimeStreak = 0;
  if (gateScans.length > 0) {
    const days = new Set<string>();
    for (const scan of gateScans) {
      days.add(new Date(scan.createdAt).toISOString().split('T')[0]);
    }

    const sortedDays = Array.from(days).sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    // Start counting from today or yesterday
    let checkDate = today;
    if (!sortedDays.includes(today) && sortedDays.length > 0) {
      checkDate = sortedDays[0];
    }

    for (const day of sortedDays) {
      if (day === checkDate) {
        onTimeStreak++;
        // Move to previous day
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split('T')[0];
      } else {
        break;
      }
    }
  }

  const activeDays = firstLeave
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstLeave.createdAt).getTime()) / 86_400_000))
    : 0;

  // Calculate badges
  const badges: Badge[] = [
    { id: 'first-leave', label: 'First Outing', icon: '🎒', earned: approvedLeaves >= 1, description: 'Got your first leave approved' },
    { id: 'streak-5', label: 'Punctual', icon: '⏰', earned: onTimeStreak >= 5, description: '5-day on-time return streak' },
    { id: 'streak-15', label: 'Time Keeper', icon: '🏆', earned: onTimeStreak >= 15, description: '15-day on-time return streak' },
    { id: 'streak-30', label: 'Legendary', icon: '👑', earned: onTimeStreak >= 30, description: '30-day on-time return streak' },
    { id: 'reporter', label: 'Problem Solver', icon: '🔧', earned: resolvedComplaints >= 3, description: 'Had 3 complaints resolved' },
    { id: 'veteran', label: 'Veteran', icon: '🎖️', earned: activeDays >= 90, description: '90 days in the hostel' },
  ];

  return {
    onTimeStreak,
    totalApprovedLeaves: approvedLeaves,
    resolvedComplaints,
    activeDays,
    badges,
  };
}
