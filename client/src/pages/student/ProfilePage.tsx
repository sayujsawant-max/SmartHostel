import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { MotionCard } from '@/components/motion/MotionCard';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import StatusBadge from '@components/ui/StatusBadge';
import { PageSkeleton } from '@components/Skeleton';
import ErrorBanner from '@components/ui/ErrorBanner';

interface FeeItem {
  _id: string;
  amount: number;
  status: string;
}

interface Leave {
  _id: string;
  status: string;
}

interface Complaint {
  _id: string;
  status: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      apiFetch<{ fees: FeeItem[] }>('/assistant/fees').catch(() => ({ data: { fees: [] } })),
      apiFetch<{ leaves: Leave[] }>('/leaves').catch(() => ({ data: { leaves: [] } })),
      apiFetch<{ complaints: Complaint[] }>('/complaints').catch(() => ({ data: { complaints: [] } })),
    ])
      .then(([feesRes, leavesRes, complaintsRes]) => {
        setFees(feesRes.data.fees);
        setLeaves(leavesRes.data.leaves);
        setComplaints(complaintsRes.data.complaints);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBanner variant="block" message={error} onRetry={fetchData} />;

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  // Fee summary
  const totalPaid = fees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fees.filter((f) => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = fees.filter((f) => f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0);

  // Leave stats
  const totalLeaves = leaves.length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'SCANNED_OUT' || l.status === 'SCANNED_IN').length;
  const approvedPct = totalLeaves > 0 ? Math.round((approvedCount / totalLeaves) * 100) : 0;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  // Complaint stats
  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <Reveal>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
            <span className="text-3xl font-bold text-[hsl(var(--accent-foreground))]">{initial}</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">{user?.name}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <StatusBadge variant="accent">{user?.role}</StatusBadge>
              {user?.gender && (
                <StatusBadge variant="neutral">
                  {user.gender === 'MALE' ? 'Male' : 'Female'}
                </StatusBadge>
              )}
              {user?.academicYear && (
                <StatusBadge variant="neutral">Year {user.academicYear}</StatusBadge>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Room Info Card */}
      {user && (user.block || user.roomNumber) && (
        <Reveal delay={0.1}>
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Room Info</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {user.block && (
                <div>
                  <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.block}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Block</p>
                </div>
              )}
              {user.floor && (
                <div>
                  <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.floor}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Floor</p>
                </div>
              )}
              {user.roomNumber && (
                <div>
                  <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.roomNumber}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Room</p>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      )}

      <StaggerContainer stagger={0.08} className="space-y-4">
        {/* Fee Summary */}
        <StaggerItem>
          <MotionCard>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Fee Summary</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    <AnimatedCounter to={totalPaid} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Paid</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    <AnimatedCounter to={totalPending} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Pending</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    <AnimatedCounter to={totalOverdue} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Overdue</p>
                </div>
              </div>
            </div>
          </MotionCard>
        </StaggerItem>

        {/* Leave Stats */}
        <StaggerItem>
          <MotionCard>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Leave Stats</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                    <AnimatedCounter to={totalLeaves} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    <AnimatedCounter to={approvedPct} suffix="%" />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Approved</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    <AnimatedCounter to={rejectedCount} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Rejected</p>
                </div>
              </div>
            </div>
          </MotionCard>
        </StaggerItem>

        {/* Complaint Stats */}
        <StaggerItem>
          <MotionCard>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Complaints</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    <AnimatedCounter to={openCount} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Open</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    <AnimatedCounter to={inProgressCount} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">In Progress</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    <AnimatedCounter to={resolvedCount} />
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Resolved</p>
                </div>
              </div>
            </div>
          </MotionCard>
        </StaggerItem>
      </StaggerContainer>

      {/* Quick Links */}
      <Reveal delay={0.3}>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Quick Links</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { to: '/student/actions/report-issue', label: 'Report Issue' },
              { to: '/student/actions/request-leave', label: 'Request Leave' },
              { to: '/student/faq', label: 'FAQ' },
            ].map((link) => (
              <MotionCard key={link.to} lift={2}>
                <Link
                  to={link.to}
                  className="block p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{link.label}</p>
                </Link>
              </MotionCard>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
