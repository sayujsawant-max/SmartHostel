import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';

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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, overridesRes, overrideStatsRes, analyticsRes] = await Promise.all([
        apiFetch<DashboardStats>('/admin/dashboard-stats'),
        apiFetch<OverrideItem[]>('/gate/overrides'),
        apiFetch<OverrideStats>('/gate/override-stats'),
        apiFetch<AnalyticsData>('/admin/analytics'),
      ]);
      setDashStats(statsRes.data);
      setOverrides(overridesRes.data);
      setOverrideStats(overrideStatsRes.data);
      setAnalytics(analyticsRes.data);
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

  const allClear = dashStats &&
    dashStats.pendingLeaves === 0 &&
    dashStats.nearBreachComplaints === 0 &&
    dashStats.breachedComplaints === 0 &&
    dashStats.pendingOverrides === 0 &&
    !dashStats.cronOverdue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Warden Dashboard</h2>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">Exception-based overview — only what needs your attention.</p>
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : (
        <>
          {/* Needs Attention Widget */}
          {allClear ? (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
              <p className="text-green-800 font-medium">All clear — no pending items or alerts right now.</p>
            </div>
          ) : dashStats && (
            <div className="grid grid-cols-2 gap-3">
              {dashStats.pendingLeaves > 0 && (
                <Link to="/warden/students" className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
                  <p className="text-2xl font-bold text-yellow-800">{dashStats.pendingLeaves}</p>
                  <p className="text-xs text-yellow-700">Pending Leaves</p>
                </Link>
              )}
              {dashStats.nearBreachComplaints > 0 && (
                <Link to="/warden/complaints" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-2xl font-bold text-amber-800">{dashStats.nearBreachComplaints}</p>
                  <p className="text-xs text-amber-700">Near-Breach (&lt;6h)</p>
                </Link>
              )}
              {dashStats.breachedComplaints > 0 && (
                <Link to="/warden/complaints" className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                  <p className="text-2xl font-bold text-red-800">{dashStats.breachedComplaints}</p>
                  <p className="text-xs text-red-700">SLA Breached</p>
                </Link>
              )}
              {dashStats.pendingOverrides > 0 && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                  <p className="text-2xl font-bold text-orange-800">{dashStats.pendingOverrides}</p>
                  <p className="text-xs text-orange-700">Overrides to Review</p>
                </div>
              )}
              {dashStats.cronOverdue && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center col-span-2">
                  <p className="text-sm font-medium text-red-800">SLA automation unhealthy</p>
                  <p className="text-xs text-red-600">
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
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
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
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{overrideStats.today}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Overrides today</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{overrideStats.lastHour}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Last hour</p>
              </div>
            </div>
          )}

          {/* Overrides Pending Review */}
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">
              Overrides Pending Review
              {overrides.length > 0 && (
                <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-red-100 text-red-700">
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
                        className="px-3 py-1.5 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium shrink-0"
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
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mt-8">Analytics</h3>

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

                {/* Total Students */}
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{analytics.occupancy.occupiedBeds}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total Students</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">of {analytics.occupancy.totalBeds} beds</p>
                </div>

                {/* Fee Collection Rate */}
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

                {/* Avg Resolution Time */}
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{analytics.complaints.avgResolutionHours}h</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Avg Resolution</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Time</p>
                </div>
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
                          className="h-full rounded-full"
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

              {/* Complaints by Status */}
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
                              className="h-full rounded"
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

                {/* Complaints by Category */}
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
                              className="h-full rounded"
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
                            className="h-full rounded"
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
                    className="h-full rounded-full"
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
        </>
      )}
    </div>
  );
}
