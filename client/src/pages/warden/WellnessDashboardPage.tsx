import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@hooks/usePageTitle';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

/* ───── types ───── */
interface RiskStudent {
  id: string;
  name: string;
  block: string;
  room: string;
  riskScore: number;
  riskFactors: string[];
  attendance: number;
  complaints: number;
  missedMeals: number;
  lastActivity: string;
}

interface WellnessData {
  totalStudents: number;
  atRiskCount: number;
  averageAttendance: number;
  activeFlags: number;
  riskDistribution: { name: string; value: number; color: string }[];
  weeklyTrends: { week: string; index: number }[];
  students: RiskStudent[];
}

/* ───── mock fallback ───── */
const MOCK_DATA: WellnessData = {
  totalStudents: 482,
  atRiskCount: 37,
  averageAttendance: 81,
  activeFlags: 14,
  riskDistribution: [
    { name: 'Low Risk', value: 320, color: '#10b981' },
    { name: 'Medium', value: 105, color: '#f59e0b' },
    { name: 'High', value: 42, color: '#f43f5e' },
    { name: 'Critical', value: 15, color: '#ef4444' },
  ],
  weeklyTrends: [
    { week: 'W1', index: 72 },
    { week: 'W2', index: 74 },
    { week: 'W3', index: 71 },
    { week: 'W4', index: 76 },
    { week: 'W5', index: 78 },
    { week: 'W6', index: 75 },
    { week: 'W7', index: 80 },
    { week: 'W8', index: 82 },
  ],
  students: [
    { id: '1', name: 'Arjun Mehta', block: 'A', room: '204', riskScore: 92, riskFactors: ['Low Attendance', 'Frequent Complaints', 'Missed Meals'], attendance: 42, complaints: 8, missedMeals: 34, lastActivity: '3 days ago' },
    { id: '2', name: 'Priya Sharma', block: 'B', room: '118', riskScore: 78, riskFactors: ['Low Attendance', 'No Activity'], attendance: 55, complaints: 2, missedMeals: 12, lastActivity: '5 days ago' },
    { id: '3', name: 'Rahul Verma', block: 'A', room: '312', riskScore: 71, riskFactors: ['Frequent Complaints', 'Missed Meals'], attendance: 68, complaints: 11, missedMeals: 28, lastActivity: '1 day ago' },
    { id: '4', name: 'Sneha Patel', block: 'C', room: '105', riskScore: 65, riskFactors: ['Missed Meals', 'No Activity'], attendance: 72, complaints: 1, missedMeals: 40, lastActivity: '7 days ago' },
    { id: '5', name: 'Karan Singh', block: 'B', room: '220', riskScore: 58, riskFactors: ['Low Attendance'], attendance: 58, complaints: 3, missedMeals: 8, lastActivity: '2 days ago' },
    { id: '6', name: 'Ananya Gupta', block: 'A', room: '410', riskScore: 53, riskFactors: ['Frequent Complaints', 'Low Attendance'], attendance: 60, complaints: 9, missedMeals: 5, lastActivity: '1 day ago' },
    { id: '7', name: 'Vikram Joshi', block: 'C', room: '308', riskScore: 47, riskFactors: ['Missed Meals'], attendance: 75, complaints: 0, missedMeals: 22, lastActivity: 'Today' },
    { id: '8', name: 'Deepa Nair', block: 'B', room: '115', riskScore: 41, riskFactors: ['No Activity'], attendance: 80, complaints: 1, missedMeals: 6, lastActivity: '10 days ago' },
  ],
};

/* ───── helpers ───── */
function riskColor(score: number) {
  if (score >= 80) return 'text-red-500 dark:text-red-400';
  if (score >= 60) return 'text-rose-500 dark:text-rose-400';
  if (score >= 40) return 'text-amber-500 dark:text-amber-400';
  return 'text-emerald-500 dark:text-emerald-400';
}

function riskBg(score: number) {
  if (score >= 80) return 'bg-red-500/10 border-red-500/30';
  if (score >= 60) return 'bg-rose-500/10 border-rose-500/30';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-emerald-500/10 border-emerald-500/30';
}

function factorColor(factor: string) {
  switch (factor) {
    case 'Low Attendance':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25';
    case 'Frequent Complaints':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25';
    case 'Missed Meals':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/25';
    case 'No Activity':
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/25';
    default:
      return 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-gray-500/25';
  }
}

/* ───── component ───── */
export default function WellnessDashboardPage() {
  usePageTitle('Wellness Dashboard');
  const [data, setData] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alertingId, setAlertingId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/admin/analytics');
        const d = res?.data ?? res;
        if (d && typeof d === 'object') {
          setData({
            totalStudents: d.totalStudents ?? MOCK_DATA.totalStudents,
            atRiskCount: d.atRiskCount ?? MOCK_DATA.atRiskCount,
            averageAttendance: d.averageAttendance ?? MOCK_DATA.averageAttendance,
            activeFlags: d.activeFlags ?? MOCK_DATA.activeFlags,
            riskDistribution: d.riskDistribution ?? MOCK_DATA.riskDistribution,
            weeklyTrends: d.weeklyTrends ?? MOCK_DATA.weeklyTrends,
            students: d.students ?? MOCK_DATA.students,
          });
        } else {
          setData(MOCK_DATA);
        }
      } catch {
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSendAlert = useCallback(async (student: RiskStudent) => {
    setAlertingId(student.id);
    try {
      await apiFetch('/admin/wellness-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, type: 'alert' }),
      });
    } catch {
      showError('Failed to send alert');
    } finally {
      setTimeout(() => setAlertingId(null), 1200);
    }
  }, []);

  const handleScheduleMeeting = useCallback(async (student: RiskStudent) => {
    setMeetingId(student.id);
    try {
      await apiFetch('/admin/wellness-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, type: 'meeting' }),
      });
    } catch {
      showError('Failed to schedule meeting');
    } finally {
      setTimeout(() => setMeetingId(null), 1200);
    }
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  const sortedStudents = [...data.students].sort((a, b) =>
    sortAsc ? a.riskScore - b.riskScore : b.riskScore - a.riskScore
  );

  const stats = [
    { label: 'Students Monitored', value: data.totalStudents, icon: '👁', color: 'text-blue-500 dark:text-blue-400' },
    { label: 'At-Risk Count', value: data.atRiskCount, icon: '⚠', color: 'text-rose-500 dark:text-rose-400' },
    { label: 'Avg Attendance %', value: data.averageAttendance, icon: '📊', suffix: '%', color: 'text-emerald-500 dark:text-emerald-400' },
    { label: 'Active Flags', value: data.activeFlags, icon: '🚩', color: 'text-amber-500 dark:text-amber-400' },
  ];

  return (
    <div className="min-h-screen space-y-8 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Student Wellness Dashboard"
        subtitle="Monitor student well-being and flag at-risk individuals"
      />

      {/* ── stat cards ── */}
      <Reveal>
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={spring}
                className="card-glow accent-line relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/25 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{s.label}</span>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <div className={`mt-2 text-3xl font-bold ${s.color}`}>
                  <AnimatedCounter value={s.value} />
                  {s.suffix ?? ''}
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Reveal>

      {/* ── charts row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* risk distribution pie */}
        <Reveal>
          <motion.div
            whileHover={{ y: -2 }}
            transition={spring}
            className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Risk Level Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </Reveal>

        {/* wellness trends area chart */}
        <Reveal>
          <motion.div
            whileHover={{ y: -2 }}
            transition={spring}
            className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Weekly Wellness Index</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.weeklyTrends}>
                <defs>
                  <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#wellnessGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </Reveal>
      </div>

      {/* ── at-risk student list ── */}
      <Reveal>
        <div className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">At-Risk Students</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              onClick={() => setSortAsc((p) => !p)}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))]"
            >
              Sort: Risk {sortAsc ? '↑ Low first' : '↓ High first'}
            </motion.button>
          </div>

          <StaggerContainer className="space-y-3">
            {sortedStudents.map((student) => {
              const isExpanded = expandedId === student.id;
              return (
                <StaggerItem key={student.id}>
                  <motion.div
                    layout
                    transition={spring}
                    className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                      isExpanded
                        ? 'border-[hsl(var(--primary))]/40 bg-[hsl(var(--accent))]/30'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))]/20'
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : student.id)}
                  >
                    {/* main row */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[160px]">
                        <p className="font-semibold text-[hsl(var(--foreground))]">{student.name}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Block {student.block} &middot; Room {student.room}
                        </p>
                      </div>

                      {/* risk score badge */}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-bold ${riskBg(student.riskScore)} ${riskColor(student.riskScore)}`}>
                        {student.riskScore}
                      </div>

                      {/* risk factor pills */}
                      <div className="flex flex-wrap gap-2">
                        {student.riskFactors.map((f) => (
                          <span key={f} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${factorColor(f)}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={spring}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[hsl(var(--border))] pt-4 sm:grid-cols-4">
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">Attendance</p>
                              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{student.attendance}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">Complaints Filed</p>
                              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{student.complaints}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">Missed Meals</p>
                              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{student.missedMeals}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">Last Activity</p>
                              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{student.lastActivity}</p>
                            </div>
                          </div>

                          {/* action buttons */}
                          <div className="mt-4 flex gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={spring}
                              disabled={alertingId === student.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendAlert(student);
                              }}
                              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-rose-600 disabled:opacity-60"
                            >
                              {alertingId === student.id ? 'Sending...' : 'Send Alert'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={spring}
                              disabled={meetingId === student.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleMeeting(student);
                              }}
                              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] disabled:opacity-60"
                            >
                              {meetingId === student.id ? 'Scheduling...' : 'Schedule Meeting'}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </Reveal>
    </div>
  );
}
