import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import FilterPanel from '@components/ui/FilterPanel';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface Leave {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  studentId?: { _id: string; name: string; block?: string; roomNumber?: string };
}

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
  SCANNED_OUT: 'info',
  SCANNED_IN: 'info',
  COMPLETED: 'neutral',
};

export default function StudentsPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchLeaves = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await apiFetch<{ leaves: Leave[] }>(`/leaves${params}`);
      setLeaves(res.data.leaves);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchLeaves();
  }, [fetchLeaves]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/leaves/${id}/approve`, { method: 'PATCH' });
      void fetchLeaves();
    } catch {
      // silently fail
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch(`/leaves/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      setRejectingId(null);
      setRejectReason('');
      void fetchLeaves();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader
          title="Leave Management"
          description="Review and approve student leave requests."
          action={
            <FilterPanel.Select value={statusFilter} onChange={setStatusFilter}>
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SCANNED_OUT">Scanned Out</option>
              <option value="COMPLETED">Completed</option>
            </FilterPanel.Select>
          }
        />
      </Reveal>

      {loading ? (
        <PageSkeleton />
      ) : leaves.length === 0 ? (
        <EmptyState variant="compact" title="No leaves found" description="No leave requests match the current filter." />
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <div
              key={l._id}
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {l.studentId?.name ?? 'Unknown'}
                    {l.studentId?.block && <span className="ml-1 text-xs opacity-60">Block {l.studentId.block}</span>}
                    {l.studentId?.roomNumber && <span className="ml-1 text-xs opacity-60">Room {l.studentId.roomNumber}</span>}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {l.type === 'DAY_OUTING' ? 'Day Outing' : 'Overnight'} &middot;{' '}
                    {new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} —{' '}
                    {new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <StatusBadge variant={STATUS_VARIANT[l.status] ?? 'neutral'}>
                  {l.status.replace(/_/g, ' ')}
                </StatusBadge>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{l.reason}</p>

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Submitted {new Date(l.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>

              {l.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => void handleApprove(l._id)}
                    className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>

                  <AnimatePresence mode="wait">
                  {rejectingId === l._id ? (
                    <motion.div key="reject-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => void handleReject(l._id)}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="text-xs text-[hsl(var(--muted-foreground))] hover:underline"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="reject-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setRejectingId(l._id)}
                      className="px-4 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </motion.button>
                  )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
