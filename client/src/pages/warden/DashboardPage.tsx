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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, overridesRes, overrideStatsRes] = await Promise.all([
        apiFetch<DashboardStats>('/admin/dashboard-stats'),
        apiFetch<OverrideItem[]>('/gate/overrides'),
        apiFetch<OverrideStats>('/gate/override-stats'),
      ]);
      setDashStats(statsRes.data);
      setOverrides(overridesRes.data);
      setOverrideStats(overrideStatsRes.data);
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
        </>
      )}
    </div>
  );
}
