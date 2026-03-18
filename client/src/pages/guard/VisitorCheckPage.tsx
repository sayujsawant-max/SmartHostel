import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface VisitorItem {
  _id: string;
  visitorName: string;
  visitorPhone: string;
  relationship: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  status: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  studentId?: { _id: string; name: string; email: string; roomNumber?: string; block?: string } | null;
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  APPROVED: 'accent',
  CHECKED_IN: 'info',
};

export default function VisitorCheckPage() {
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await apiFetch<VisitorItem[]>(`/visitors?date=${todayStr}`);
      // Only show APPROVED and CHECKED_IN visitors
      setVisitors(res.data.filter((v) => v.status === 'APPROVED' || v.status === 'CHECKED_IN'));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    void fetchVisitors();
  }, [fetchVisitors]);

  const handleCheckIn = async (id: string) => {
    try {
      await apiFetch(`/visitors/${id}/check-in`, { method: 'PATCH' });
      void fetchVisitors();
    } catch {
      // silently fail
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await apiFetch(`/visitors/${id}/check-out`, { method: 'PATCH' });
      void fetchVisitors();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader
          title="Visitor Check-In/Out"
          description="Manage today's approved visitors at the gate."
        />
      </Reveal>

      {loading ? (
        <PageSkeleton />
      ) : visitors.length === 0 ? (
        <EmptyState variant="compact" title="No approved visitors for today" description="Approved visitors will appear here." />
      ) : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div
              key={v._id}
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">{v.visitorName}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {v.visitorPhone} &middot; {v.relationship}
                  </p>
                </div>
                <StatusBadge variant={STATUS_VARIANT[v.status] ?? 'neutral'}>
                  {v.status.replace(/_/g, ' ')}
                </StatusBadge>
              </div>

              {/* Student info */}
              {v.studentId && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Student: {v.studentId.name}
                  {v.studentId.block && <span className="ml-1 opacity-60">Block {v.studentId.block}</span>}
                  {v.studentId.roomNumber && <span className="ml-1 opacity-60">Room {v.studentId.roomNumber}</span>}
                </p>
              )}

              <p className="text-sm text-[hsl(var(--foreground))]">{v.purpose}</p>

              <div className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap gap-3">
                {v.expectedTime && <span>Expected: {v.expectedTime}</span>}
                {v.checkedInAt && <span>In: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>

              {/* Action buttons */}
              <div className="pt-1">
                {v.status === 'APPROVED' && (
                  <button
                    onClick={() => void handleCheckIn(v._id)}
                    className="px-4 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Check In
                  </button>
                )}
                {v.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => void handleCheckOut(v._id)}
                    className="px-4 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
