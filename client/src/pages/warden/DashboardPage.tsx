import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [stats, setStats] = useState<OverrideStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [overridesRes, statsRes] = await Promise.all([
        apiFetch<OverrideItem[]>('/gate/overrides'),
        apiFetch<OverrideStats>('/gate/override-stats'),
      ]);
      setOverrides(overridesRes.data);
      setStats(statsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleReview = async (id: string) => {
    try {
      await apiFetch(`/gate/overrides/${id}/review`, { method: 'PATCH' });
      setOverrides((prev) => prev.filter((o) => o._id !== id));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Warden Dashboard</h2>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">Overview of hostel operations, pending approvals, and alerts.</p>
      </div>

      {/* Override Spike Alert */}
      {stats?.spikeAlert && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
          <p className="font-semibold">{stats.spikeMessage}</p>
          {stats.perGuard.length > 0 && (
            <div className="mt-2 text-sm">
              {stats.perGuard.map((g) => (
                <p key={g.guardId}>{g.guardName}: {g.count} override{g.count > 1 ? 's' : ''} today</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override Stats (non-spike) */}
      {stats && !stats.spikeAlert && (
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.today}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Overrides today</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.lastHour}</p>
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

        {loading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
        ) : overrides.length === 0 ? (
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
    </div>
  );
}
