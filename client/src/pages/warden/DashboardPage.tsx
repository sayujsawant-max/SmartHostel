import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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
  const [loading, setLoading] = useState(true);

  const fetchOverrides = useCallback(async () => {
    try {
      const res = await apiFetch<OverrideItem[]>('/gate/overrides');
      setOverrides(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverrides();
  }, [fetchOverrides]);

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
