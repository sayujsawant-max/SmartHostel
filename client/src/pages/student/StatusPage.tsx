import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

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
  const pendingFees = fees.filter((f) => f.status !== 'PAID').length;
  const activeLeave = leaves.find((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Your hostel status at a glance"
      />

      {/* No Room Banner */}
      {user && !user.roomNumber && (
        <Link
          to="/student/room-request"
          className="block p-4 rounded-xl bg-amber-50 border border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/40 text-center"
        >
          <p className="text-amber-900 dark:text-amber-200 font-semibold">You don&apos;t have a room assigned yet</p>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">Tap here to browse and request a room</p>
        </Link>
      )}

      {/* Room Info */}
      {user && (user.block || user.roomNumber) && (
        <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
          {user.block && <span>Block {user.block}</span>}
          {user.floor && <span> · Floor {user.floor}</span>}
          {user.roomNumber && <span> · Room {user.roomNumber}</span>}
        </div>
      )}

      {/* Quick Stats */}
      <Reveal>
        <div className="grid grid-cols-3 gap-2">
          <a href="#complaints" className="block p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              <AnimatedCounter to={activeComplaints} />
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Complaints</p>
          </a>
          <a href="#leaves" className="block p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              <AnimatedCounter to={activeLeaves} />
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Leaves</p>
          </a>
          <button
            onClick={() => setShowFees(!showFees)}
            className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              <AnimatedCounter to={pendingFees} />
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Fees Due</p>
          </button>
        </div>
      </Reveal>

      {/* Fee Status (expandable) */}
      <AnimatePresence>
        {showFees && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Fee Status</h2>
            {fees.length === 0 ? (
              <EmptyState variant="compact" title="No fee records" description="No fee records found." />
            ) : (
              fees.map((f) => (
                <div
                  key={f._id}
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
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notices */}
      {notices.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Notices</h2>
          {notices.map((n) => (
            <div key={n._id} className="p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40 space-y-1">
              <p className="font-medium text-sm text-blue-900 dark:text-blue-200">{n.title}</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">{n.content}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {n.authorId?.name && ` · ${n.authorId.name}`}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Leaves */}
      <section className="space-y-3">
        <h2 id="leaves" className="text-lg font-bold text-[hsl(var(--foreground))]">My Leaves</h2>

        {activeLeave && (
          <Link
            to="/student/actions/show-qr"
            className="block p-4 bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 rounded-xl text-center"
          >
            <p className="text-green-800 dark:text-green-200 font-semibold">You have an active pass</p>
            <p className="text-green-600 dark:text-green-400 text-sm mt-1">Tap to show QR code</p>
          </Link>
        )}

        {leaves.length === 0 ? (
          <EmptyState
            variant="compact"
            title="No leaves yet"
            description="Your leave requests will appear here."
            action={
              <Link to="/student/actions" className="text-sm font-medium text-[hsl(var(--accent))] hover:underline">
                Request Leave &rarr;
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {leaves.map((leave) => {
              const hint = getLeaveHint(leave.status);
              return (
                <div
                  key={leave._id}
                  className="border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))]"
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
                    <p className="text-xs text-[hsl(var(--accent))] mt-1">
                      {hint.text}
                      {hint.link && <Link to={hint.link.to} className="ml-1 underline">{hint.link.label}</Link>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Complaints */}
      <section className="space-y-3">
        <h2 id="complaints" className="text-lg font-bold text-[hsl(var(--foreground))]">My Complaints</h2>

        {complaints.length === 0 ? (
          <EmptyState
            variant="compact"
            title="No complaints filed"
            description="Issues you report will be tracked here."
            action={
              <Link to="/student/actions/report-issue" className="text-sm font-medium text-[hsl(var(--accent))] hover:underline">
                Report an Issue &rarr;
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {complaints.map((c) => (
              <Link
                key={c._id}
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
                  <p className="text-xs text-[hsl(var(--accent))]">{getComplaintHint(c.status)}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
