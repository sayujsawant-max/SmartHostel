import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';
import StatusBadge from '@components/ui/StatusBadge';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Home,
  UtensilsCrossed,
  Users,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import StreakBanner from '@components/StreakBanner';
import { usePageTitle } from '@hooks/usePageTitle';

/* ─── Types ─────────────────────────────────────────────────────── */

interface FeeItem {
  _id: string;
  feeType: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  semester: string;
  academicYear: string;
}

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  target: string;
  authorId?: { _id: string; name: string };
  createdAt: string;
}

interface Leave {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Complaint {
  _id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Color maps ────────────────────────────────────────────────── */

const COMPLAINT_STATUS: Record<string, 'info' | 'accent' | 'warning' | 'success' | 'neutral'> = {
  OPEN: 'info',
  ASSIGNED: 'accent',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'neutral' | 'success'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'success',
};

const LEAVE_STATUS: Record<string, 'warning' | 'success' | 'error' | 'neutral' | 'info'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
  SCANNED_OUT: 'info',
  SCANNED_IN: 'info',
  COMPLETED: 'neutral',
  EXPIRED: 'warning',
};

const FEE_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  PAID: 'success',
  UNPAID: 'warning',
  OVERDUE: 'error',
};

/* ─── Helpers ───────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getLeaveHint(status: string): { text: string; link?: { label: string; to: string } } | null {
  switch (status) {
    case 'PENDING': return { text: 'Waiting for warden approval.' };
    case 'APPROVED': return { text: 'Your pass is ready.', link: { label: 'Show QR at Gate', to: '/student/actions/show-qr' } };
    case 'REJECTED': return { text: 'Rejected.', link: { label: 'Request a New Leave', to: '/student/actions' } };
    case 'SCANNED_OUT': return { text: 'You are currently out. Return before your pass expires.' };
    default: return null;
  }
}

function getComplaintHint(status: string): string | null {
  switch (status) {
    case 'OPEN': return 'Waiting for assignment.';
    case 'ASSIGNED': return 'Assigned to maintenance staff.';
    case 'IN_PROGRESS': return 'Work is in progress.';
    case 'RESOLVED': return 'Issue resolved. Check resolution notes.';
    default: return null;
  }
}

/* ─── Animation config ─────────────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

/* ─── Quick actions data ───────────────────────────────────────── */

const QUICK_ACTIONS = [
  {
    to: '/student/actions/request-leave',
    title: 'Request Leave',
    desc: 'Apply for leave',
    icon: Calendar,
    color: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
  },
  {
    to: '/student/actions/report-issue',
    title: 'Report Issue',
    desc: 'File a complaint',
    icon: AlertTriangle,
    color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  },
  {
    to: '/student/mess-menu',
    title: 'View Menu',
    desc: 'Check mess menu',
    icon: UtensilsCrossed,
    color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  },
  {
    to: '/student/laundry',
    title: 'Book Laundry',
    desc: 'Schedule laundry',
    icon: Users,
    color: 'bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400',
  },
];

/* ─── SLA Badge ─────────────────────────────────────────────────── */

function SLABadge({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const diffMs = new Date(dueAt).getTime() - now;
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  if (diffMs < 0) return <StatusBadge variant="error">Overdue {Math.abs(diffH)}h</StatusBadge>;
  if (diffH <= 2) return <StatusBadge variant="warning">Due in {diffH}h</StatusBadge>;
  return <span className="text-xs text-[hsl(var(--muted-foreground))]">Due in {diffH}h</span>;
}

/* ─── Component ─────────────────────────────────────────────────── */

export default function StatusPage() {
  usePageTitle('Status');
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [showFees, setShowFees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadData() {
    setError('');
    setLoading(true);
    Promise.all([
      apiFetch<{ leaves: Leave[] }>('/leaves'),
      apiFetch<{ complaints: Complaint[] }>('/complaints'),
      apiFetch<{ notices: NoticeItem[] }>('/notices/my-notices').catch(() => ({ data: { notices: [] } })),
      apiFetch<{ fees: FeeItem[] }>('/assistant/fees').catch(() => ({ data: { fees: [] } })),
    ])
      .then(([leavesRes, complaintsRes, noticesRes, feesRes]) => {
        setLeaves(leavesRes.data.leaves);
        setComplaints(complaintsRes.data.complaints);
        setNotices(noticesRes.data.notices);
        setFees(feesRes.data.fees);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBanner variant="block" message={error} onRetry={loadData} />;

  const activeComplaints = complaints.filter((c) => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length;
  const activeLeaves = leaves.filter((l) => l.status === 'PENDING' || l.status === 'APPROVED' || l.status === 'SCANNED_OUT').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED').length;
  const pendingFees = fees.filter((f) => f.status !== 'PAID').length;
  const outstandingAmount = fees.filter((f) => f.status !== 'PAID').reduce((sum, f) => sum + f.amount, 0);
  const activeLeave = leaves.find((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');

  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <div className="space-y-6">
      {/* ── Hero welcome card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' }}
      >
        {/* Animated gradient shimmer */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating hero icon */}
        <motion.div
          className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Home className="w-8 h-8 text-white/80" />
        </motion.div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl sm:text-3xl font-bold"
          >
            Welcome back, {firstName}!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-white/80 mt-1 text-sm"
          >
            Here&apos;s what&apos;s happening with your hostel life
          </motion.p>

          {user && (user.block || user.roomNumber) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              {user.block && <>Block {user.block}</>}
              {user.floor && <> · Floor {user.floor}</>}
              {user.roomNumber && <> · Room {user.roomNumber}</>}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* No Room Banner */}
      {user && !user.roomNumber && (
        <Reveal>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={spring}>
            <Link
              to="/student/room-request"
              className="block p-4 rounded-xl bg-amber-50 border border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/40 text-center"
            >
              <p className="text-amber-900 dark:text-amber-200 font-semibold">You don&apos;t have a room assigned yet</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">Tap here to browse and request a room</p>
            </Link>
          </motion.div>
        </Reveal>
      )}

      {/* ── Streak & Badges ─────────────────────────────────── */}
      <Reveal>
        <StreakBanner />
      </Reveal>

      {/* ── Stats cards ───────────────────────────────────────── */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3" stagger={0.08}>
        {[
          { value: activeComplaints, label: 'Active Complaints', icon: AlertTriangle, color: 'bg-amber-100 dark:bg-amber-950/50', iconColor: 'text-amber-600 dark:text-amber-400', trend: activeComplaints > 0 ? `${activeComplaints} open` : undefined, trendColor: 'text-amber-600 dark:text-amber-400' },
          { value: activeLeaves, label: 'Pending Leaves', icon: Calendar, color: 'bg-blue-100 dark:bg-blue-950/50', iconColor: 'text-blue-600 dark:text-blue-400' },
          { value: approvedLeaves, label: 'Approved Leaves', icon: CheckCircle2, color: 'bg-emerald-100 dark:bg-emerald-950/50', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { value: pendingFees > 0 ? outstandingAmount : 0, label: 'Outstanding Fees', icon: CreditCard, color: 'bg-red-100 dark:bg-red-950/50', iconColor: 'text-red-600 dark:text-red-400', isFee: true },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <motion.div
                className="rounded-xl p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow cursor-pointer card-glow"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
                onClick={stat.label === 'Outstanding Fees' ? () => setShowFees(!showFees) : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] leading-tight">{stat.label}</p>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  {stat.isFee && stat.value > 0 ? (
                    <>&#8377;<AnimatedCounter to={stat.value} duration={1.2} /></>
                  ) : (
                    <AnimatedCounter to={stat.value} duration={1} />
                  )}
                </p>
                {'trend' in stat && stat.trend && (
                  <p className={`text-[10px] font-medium mt-1 ${'trendColor' in stat ? stat.trendColor : ''}`}>
                    &#8595; {stat.trend}
                  </p>
                )}
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <section>
        <Reveal>
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-3">Quick Actions</h2>
        </Reveal>
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3" stagger={0.06}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <StaggerItem key={action.to}>
                <motion.div
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                >
                  <Link
                    to={action.to}
                    className="block p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-indigo-500/30 hover:shadow-md transition-all"
                  >
                    <motion.div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${action.color}`}
                      whileHover={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{action.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{action.desc}</p>
                  </Link>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>

      {/* ── Fee Status (expandable) ────────────────────────────── */}
      <AnimatePresence>
        {showFees && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Fee Status</h2>
              <motion.button
                onClick={() => setShowFees(false)}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronDown className="w-4 h-4 rotate-180" />
              </motion.button>
            </div>
            {fees.length === 0 ? (
              <EmptyState variant="compact" title="No fee records" description="No fee records found." />
            ) : (
              fees.map((f) => (
                <motion.div
                  key={f._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{f.feeType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{f.semester} · {f.academicYear}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Due {formatDate(f.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">{f.currency} {f.amount.toLocaleString('en-IN')}</p>
                    <StatusBadge variant={FEE_VARIANT[f.status] ?? 'neutral'}>{f.status}</StatusBadge>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recent Notices ────────────────────────────────────── */}
      {notices.length > 0 && (
        <section className="space-y-3">
          <Reveal>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Recent Notices</h2>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">View all</span>
            </div>
          </Reveal>
          <StaggerContainer className="space-y-2" stagger={0.06}>
            {notices.map((n) => {
              const isHighPriority = n.title.toLowerCase().includes('inspection') || n.title.toLowerCase().includes('urgent');
              return (
                <StaggerItem key={n._id}>
                  <motion.div
                    className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-1.5 hover:shadow-sm transition-shadow"
                    whileHover={{ x: 2 }}
                    transition={spring}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{n.title}</p>
                      {isHighPriority && (
                        <StatusBadge variant="warning">High Priority</StatusBadge>
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{n.content}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                      <Calendar className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {n.authorId?.name && <> · {n.authorId.name}</>}
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      )}

      {/* ── Leaves ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <Reveal>
          <h2 id="leaves" className="text-lg font-bold text-[hsl(var(--foreground))]">My Leaves</h2>
        </Reveal>

        {activeLeave && (
          <Reveal delay={0.05}>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={spring}>
              <Link
                to="/student/actions/show-qr"
                className="block p-4 bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 rounded-xl text-center"
              >
                <p className="text-green-800 dark:text-green-200 font-semibold">You have an active pass</p>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">Tap to show QR code</p>
              </Link>
            </motion.div>
          </Reveal>
        )}

        {leaves.length === 0 ? (
          <EmptyState
            variant="compact"
            title="No leaves yet"
            description="Your leave requests will appear here."
            action={
              <Link to="/student/actions" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Request Leave <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
        ) : (
          <StaggerContainer className="space-y-2" stagger={0.05}>
            {leaves.map((leave) => {
              const hint = getLeaveHint(leave.status);
              return (
                <StaggerItem key={leave._id}>
                  <motion.div
                    className="border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))] hover:shadow-sm transition-shadow"
                    whileHover={{ x: 2 }}
                    transition={spring}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {leave.type === 'DAY_OUTING' ? 'Day Outing' : 'Overnight'}
                      </span>
                      <StatusBadge variant={LEAVE_STATUS[leave.status] ?? 'neutral'}>
                        {leave.status.replace(/_/g, ' ')}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 truncate">{leave.reason}</p>
                    {leave.rejectionReason && (
                      <p className="text-sm text-[hsl(var(--destructive))] mt-1">Reason: {leave.rejectionReason}</p>
                    )}
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      Submitted {formatDate(leave.createdAt)}
                    </p>
                    {hint && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        {hint.text}
                        {hint.link && <Link to={hint.link.to} className="ml-1 underline">{hint.link.label}</Link>}
                      </p>
                    )}
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>

      {/* ── Complaints ────────────────────────────────────────── */}
      <section className="space-y-3">
        <Reveal>
          <h2 id="complaints" className="text-lg font-bold text-[hsl(var(--foreground))]">My Complaints</h2>
        </Reveal>

        {complaints.length === 0 ? (
          <EmptyState
            variant="compact"
            title="No complaints filed"
            description="Issues you report will be tracked here."
            action={
              <Link to="/student/actions/report-issue" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Report an Issue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
        ) : (
          <StaggerContainer className="space-y-2" stagger={0.05}>
            {complaints.map((c) => (
              <StaggerItem key={c._id}>
                <motion.div whileHover={{ x: 2 }} transition={spring}>
                  <Link
                    to={`/student/status/complaint/${c._id}`}
                    className="block border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))] space-y-1 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {c.category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex gap-1.5">
                        <StatusBadge variant={COMPLAINT_STATUS[c.status] ?? 'neutral'}>
                          {c.status.replace(/_/g, ' ')}
                        </StatusBadge>
                        <StatusBadge variant={PRIORITY_VARIANT[c.priority] ?? 'neutral'}>
                          {c.priority}
                        </StatusBadge>
                      </div>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] truncate">{c.description}</p>
                    <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                      <SLABadge dueAt={c.dueAt} />
                      <span>Updated {formatDate(c.updatedAt)}</span>
                    </div>
                    {getComplaintHint(c.status) && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">{getComplaintHint(c.status)}</p>
                    )}
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}
