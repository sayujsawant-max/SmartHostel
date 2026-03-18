import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import StatCard from '@components/ui/StatCard';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface DashboardStats {
  pendingLeaves: number;
  nearBreachComplaints: number;
  breachedComplaints: number;
  pendingOverrides: number;
  cronOverdue: boolean;
  lastCronRun: string | null;
}

interface OverrideStats {
  today: number;
  lastHour: number;
  spikeAlert: boolean;
  spikeMessage: string | null;
  perGuard: { guardId: string; guardName: string; count: number }[];
}

interface AnalyticsData {
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    byBlock: { block: string; total: number; occupied: number }[];
  };
  complaints: {
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    avgResolutionHours: number;
  };
  leaves: {
    byStatus: Record<string, number>;
    thisWeek: number;
    thisMonth: number;
  };
  fees: {
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
}

interface ActivityEvent {
  type: 'LEAVE' | 'COMPLAINT' | 'GATE_SCAN' | 'NOTICE';
  action: string;
  actor: string;
  detail: string;
  timestamp: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const activityDotColors: Record<ActivityEvent['type'], string> = {
  LEAVE: '#16a34a',
  COMPLAINT: '#3b82f6',
  GATE_SCAN: '#f97316',
  NOTICE: '#8b5cf6',
};

interface SosAlert {
  _id: string;
  studentId: { _id: string; name: string; email: string; block?: string; floor?: number; roomNumber?: string };
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: { _id: string; name: string };
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface OverrideItem {
  _id: string;
  reason: string;
  note: string;
  method: string;
  createdAt: string;
  guardId?: { _id: string; name: string };
  studentId?: { _id: string; name: string; block?: string };
}

export default function DashboardPage() {
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [overrideStats, setOverrideStats] = useState<OverrideStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, overridesRes, overrideStatsRes, analyticsRes, activityRes, sosRes] = await Promise.all([
        apiFetch<DashboardStats>('/admin/dashboard-stats'),
        apiFetch<OverrideItem[]>('/gate/overrides'),
        apiFetch<OverrideStats>('/gate/override-stats'),
        apiFetch<AnalyticsData>('/admin/analytics'),
        apiFetch<ActivityEvent[]>('/admin/activity-feed'),
        apiFetch<SosAlert[]>('/sos').catch(() => ({ data: [] as SosAlert[] })),
      ]);
      setDashStats(statsRes.data);
      setOverrides(overridesRes.data);
      setOverrideStats(overrideStatsRes.data);
      setAnalytics(analyticsRes.data);
      setActivityFeed(activityRes.data);
      setSosAlerts(sosRes.data);
    } catch (err) {
      console.error('[DashboardPage] Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleReview = async (id: string) => {
    try {
      await apiFetch(`/gate/overrides/${id}/review`, { method: 'PATCH' });
      setOverrides((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error('[DashboardPage] Failed to review override', err);
    }
  };

  const handleAcknowledgeSos = async (id: string) => {
    try {
      await apiFetch(`/sos/${id}/acknowledge`, { method: 'PATCH' });
      setSosAlerts((prev) => prev.map((a) => a._id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a));
    } catch (err) {
      console.error('[DashboardPage] Failed to acknowledge SOS', err);
    }
  };

  const handleResolveSos = async (id: string) => {
    try {
      await apiFetch(`/sos/${id}/resolve`, { method: 'PATCH' });
      setSosAlerts((prev) => prev.map((a) => a._id === id ? { ...a, status: 'RESOLVED' as const } : a));
    } catch (err) {
      console.error('[DashboardPage] Failed to resolve SOS', err);
    }
  };

  const activeSosAlerts = sosAlerts.filter((a) => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED');

  const allClear = dashStats &&
    dashStats.pendingLeaves === 0 &&
    dashStats.nearBreachComplaints === 0 &&
    dashStats.breachedComplaints === 0 &&
    dashStats.pendingOverrides === 0 &&
    !dashStats.cronOverdue;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Warden Dashboard"
          description="Exception-based overview — only what needs your attention."
        />
      </Reveal>

      {/* SOS Alerts */}
      {activeSosAlerts.length > 0 && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20 p-4">
          <style>{`
            @keyframes sosBorderPulse {
              0%, 100% { border-color: #ef4444; }
              50% { border-color: #fca5a5; }
            }
            .sos-alert-active {
              animation: sosBorderPulse 1.5s ease-in-out infinite;
            }
          `}</style>
          <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            SOS Alerts
            <StatusBadge variant="error">{activeSosAlerts.length}</StatusBadge>
          </h3>
          <div className="space-y-3">
            {activeSosAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`p-3 rounded-lg bg-white dark:bg-[hsl(var(--card))] border ${alert.status === 'ACTIVE' ? 'border-red-400 sos-alert-active' : 'border-orange-300 dark:border-orange-800/40'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-900 dark:text-red-200">
                      {alert.studentId?.name ?? 'Unknown Student'}
                    </p>
                    {(alert.studentId?.block || alert.studentId?.roomNumber) && (
                      <p className="text-xs text-red-700 dark:text-red-400">
                        {alert.studentId.block && `Block ${alert.studentId.block}`}
                        {alert.studentId.floor != null && `, Floor ${alert.studentId.floor}`}
                        {alert.studentId.roomNumber && `, Room ${alert.studentId.roomNumber}`}
                      </p>
                    )}
                    <p className="text-sm text-red-800 dark:text-red-300 mt-1">{alert.message}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{timeAgo(alert.createdAt)}</p>
                    {alert.status === 'ACKNOWLEDGED' && (
                      <p className="text-xs text-orange-600 mt-0.5">Acknowledged</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => void handleAcknowledgeSos(alert._id)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => void handleResolveSos(alert._id)}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Attention Widget */}
      {allClear ? (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 text-center">
          <p className="text-green-800 dark:text-green-200 font-medium">All clear — no pending items or alerts right now.</p>
        </div>
      ) : dashStats && (
        <div className="grid grid-cols-2 gap-3">
          {dashStats.pendingLeaves > 0 && (
            <Link to="/warden/students" className="block p-3 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40 text-center hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200"><AnimatedCounter to={dashStats.pendingLeaves} /></p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">Pending Leaves</p>
            </Link>
          )}
          {dashStats.nearBreachComplaints > 0 && (
            <Link to="/warden/complaints" className="block p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 text-center hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200"><AnimatedCounter to={dashStats.nearBreachComplaints} /></p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Near-Breach (&lt;6h)</p>
            </Link>
          )}
          {dashStats.breachedComplaints > 0 && (
            <Link to="/warden/complaints" className="block p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/40 text-center hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-red-800 dark:text-red-200"><AnimatedCounter to={dashStats.breachedComplaints} /></p>
              <p className="text-xs text-red-700 dark:text-red-400">SLA Breached</p>
            </Link>
          )}
          {dashStats.pendingOverrides > 0 && (
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/40 text-center">
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200"><AnimatedCounter to={dashStats.pendingOverrides} /></p>
              <p className="text-xs text-orange-700 dark:text-orange-400">Overrides to Review</p>
            </div>
          )}
          {dashStats.cronOverdue && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/40 text-center col-span-2">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">SLA automation unhealthy</p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Last cron: {dashStats.lastCronRun
                  ? new Date(dashStats.lastCronRun).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Never'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Override Spike Alert */}
      {overrideStats?.spikeAlert && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/40 text-red-800 dark:text-red-300">
          <p className="font-semibold">{overrideStats.spikeMessage}</p>
          {overrideStats.perGuard.length > 0 && (
            <div className="mt-2 text-sm">
              {overrideStats.perGuard.map((g) => (
                <p key={g.guardId}>{g.guardName}: {g.count} override{g.count > 1 ? 's' : ''} today</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override Stats (non-spike) */}
      {overrideStats && !overrideStats.spikeAlert && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard value={overrideStats.today} label="Overrides today" />
          <StatCard value={overrideStats.lastHour} label="Last hour" />
        </div>
      )}

      {/* Overrides Pending Review */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">
          Overrides Pending Review
          {overrides.length > 0 && (
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {overrides.length}
            </span>
          )}
        </h3>

        {overrides.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No overrides pending review</p>
        ) : (
          <div className="space-y-3">
            {overrides.map((o) => (
              <div key={o._id} className="p-3 rounded-lg bg-[hsl(var(--muted))] space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">
                      {o.studentId?.name ?? 'Unknown Student'}
                      {o.studentId?.block && <span className="text-xs opacity-60 ml-1">Block {o.studentId.block}</span>}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {o.reason} — {o.method.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{o.note}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Guard: {o.guardId?.name ?? 'Unknown'} &middot; {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleReview(o._id)}
                    className="px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium shrink-0 hover:opacity-90 transition-opacity"
                  >
                    Mark Reviewed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Analytics Section ===== */}
      {analytics && (
        <>
          <Reveal>
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mt-2">Analytics</h3>
          </Reveal>

          {/* Overview Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Occupancy Rate — circular progress */}
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - analytics.occupancy.occupancyRate / 100)}`}
                  transform="rotate(-90 40 40)"
                />
                <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                  {analytics.occupancy.occupancyRate}%
                </text>
              </svg>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Occupancy Rate</p>
            </div>

            <StatCard value={analytics.occupancy.occupiedBeds} label={`of ${analytics.occupancy.totalBeds} beds`} />

            {/* Fee Collection Rate — circular progress */}
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#16a34a" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - analytics.fees.collectionRate / 100)}`}
                  transform="rotate(-90 40 40)"
                />
                <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                  {analytics.fees.collectionRate}%
                </text>
              </svg>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Fee Collection</p>
            </div>

            <StatCard value={analytics.complaints.avgResolutionHours} label="Avg Resolution Time" suffix="h" />
          </div>

          {/* Occupancy by Block */}
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Occupancy by Block</h4>
            <div className="space-y-2">
              {analytics.occupancy.byBlock.map((b) => (
                <div key={b.block} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] w-16">Block {b.block}</span>
                  <div className="flex-1 h-5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: b.total > 0 ? `${(b.occupied / b.total) * 100}%` : '0%',
                        backgroundColor: 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 text-right">{b.occupied}/{b.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Complaints by Status + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Complaints by Status</h4>
              <div className="space-y-2">
                {Object.entries(analytics.complaints.byStatus).map(([status, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.complaints.byStatus), 1);
                  const colors: Record<string, string> = {
                    OPEN: '#3b82f6',
                    IN_PROGRESS: '#f59e0b',
                    RESOLVED: '#16a34a',
                  };
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-xs text-[hsl(var(--foreground))] w-24">{status.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-4 rounded bg-[hsl(var(--muted))] overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            backgroundColor: colors[status] ?? '#6b7280',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[hsl(var(--foreground))] w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Complaints by Category</h4>
              <div className="space-y-2">
                {Object.entries(analytics.complaints.byCategory).map(([category, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.complaints.byCategory), 1);
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-xs text-[hsl(var(--foreground))] w-24">{category.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-4 rounded bg-[hsl(var(--muted))] overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            backgroundColor: '#8b5cf6',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[hsl(var(--foreground))] w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Leave Summary */}
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Leave Summary</h4>
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{analytics.leaves.thisWeek}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{analytics.leaves.thisMonth}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">This Month</p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics.leaves.byStatus).map(([status, count]) => {
                const maxCount = Math.max(...Object.values(analytics.leaves.byStatus), 1);
                const colors: Record<string, string> = {
                  PENDING: '#f59e0b',
                  APPROVED: '#16a34a',
                  REJECTED: '#ef4444',
                  COMPLETED: '#3b82f6',
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-[hsl(var(--foreground))] w-24">{status}</span>
                    <div className="flex-1 h-4 rounded bg-[hsl(var(--muted))] overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          backgroundColor: colors[status] ?? '#6b7280',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[hsl(var(--foreground))] w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fee Collection */}
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Fee Collection</h4>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[hsl(var(--muted-foreground))]">
                Collected: <span className="font-medium text-[hsl(var(--foreground))]">₹{analytics.fees.totalCollected.toLocaleString('en-IN')}</span>
              </span>
              <span className="text-[hsl(var(--muted-foreground))]">
                Pending: <span className="font-medium text-[hsl(var(--foreground))]">₹{analytics.fees.totalPending.toLocaleString('en-IN')}</span>
              </span>
            </div>
            <div className="h-6 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${analytics.fees.collectionRate}%`,
                  backgroundColor: '#16a34a',
                }}
              />
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 text-center">{analytics.fees.collectionRate}% collected</p>
          </div>
        </>
      )}

      {/* ===== Live Activity Feed ===== */}
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Live Activity Feed</h3>
          <button
            onClick={() => void fetchData()}
            className="px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs font-medium hover:opacity-80 transition-opacity"
          >
            Refresh
          </button>
        </div>

        {activityFeed.length === 0 ? (
          <EmptyState variant="compact" title="No recent activity" description="Activity events will appear here as they happen." />
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {activityFeed.map((event, idx) => (
              <div
                key={`${event.type}-${event.timestamp}-${idx}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <span
                  className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activityDotColors[event.type] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    <span className="font-semibold">{event.action}</span>
                    <span className="text-[hsl(var(--muted-foreground))]"> — {event.actor}</span>
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{event.detail}</p>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5">{timeAgo(event.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
