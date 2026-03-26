import { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import FilterPanel from '@components/ui/FilterPanel';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';

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

function isPastLeave(endDate: string): boolean {
  return new Date(endDate) < new Date(new Date().toDateString());
}

export default function StudentsPage() {
  usePageTitle('Students');
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchLeaves = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await apiFetch<{ leaves: Leave[] }>(`/leaves${params}`);
      setLeaves(res.data.leaves);
    } catch (err) {
      showError(err, 'Failed to load data');
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
      showSuccess('Leave approved');
      void import('@/utils/confetti').then(m => m.celebrateMini());
      void fetchLeaves();
    } catch (err) {
      showError(err);
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
      showSuccess('Leave rejected');
      void fetchLeaves();
    } catch (err) {
      showError(err);
    }
  };

  // Bulk operations
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING' && !isPastLeave(l.endDate));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingLeaves.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingLeaves.map(l => l._id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    let ok = 0;
    for (const id of selectedIds) {
      try {
        await apiFetch(`/leaves/${id}/approve`, { method: 'PATCH' });
        ok++;
      } catch { /* skip individual failures */ }
    }
    showSuccess(`${ok} leave${ok > 1 ? 's' : ''} approved`);
    void import('@/utils/confetti').then(m => m.celebrate());
    setSelectedIds(new Set());
    setBulkProcessing(false);
    void fetchLeaves();
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    let ok = 0;
    for (const id of selectedIds) {
      try {
        await apiFetch(`/leaves/${id}/reject`, { method: 'PATCH', body: JSON.stringify({}) });
        ok++;
      } catch { /* skip */ }
    }
    showSuccess(`${ok} leave${ok > 1 ? 's' : ''} rejected`);
    setSelectedIds(new Set());
    setBulkProcessing(false);
    void fetchLeaves();
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
          {/* Bulk Action Bar */}
          {statusFilter === 'PENDING' && pendingLeaves.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm card-glow"
            >
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[hsl(var(--foreground))]">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.size === pendingLeaves.length && pendingLeaves.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4.5 h-4.5 rounded-md border-[hsl(var(--border))] accent-[hsl(var(--accent))]"
                  />
                </motion.div>
                <span className="font-medium">Select All</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">({pendingLeaves.length})</span>
              </label>
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -12, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -12, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="flex items-center gap-2.5 ml-auto"
                  >
                    <motion.span
                      key={selectedIds.size}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="px-2.5 py-1 rounded-lg bg-[hsl(var(--accent))]/10 text-xs font-semibold text-[hsl(var(--accent))] tabular-nums"
                    >
                      {selectedIds.size} selected
                    </motion.span>
                    <motion.button
                      onClick={() => void handleBulkApprove()}
                      disabled={bulkProcessing}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-4 py-2 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {bulkProcessing ? (
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          Processing...
                        </motion.span>
                      ) : `Approve ${selectedIds.size}`}
                    </motion.button>
                    <motion.button
                      onClick={() => void handleBulkReject()}
                      disabled={bulkProcessing}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-4 py-2 rounded-xl bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] text-xs font-semibold hover:bg-[hsl(var(--destructive))]/18 disabled:opacity-50 transition-all"
                    >
                      Reject {selectedIds.size}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <Virtuoso
            useWindowScroll
            data={leaves}
            itemContent={(_index, l) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -1 }}
              className={`p-4 mb-3 rounded-2xl bg-[hsl(var(--card))] border transition-all duration-200 ${
                selectedIds.has(l._id) ? 'border-[hsl(var(--accent))] ring-1 ring-[hsl(var(--accent))]/20 shadow-sm' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/30 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3">
                  {l.status === 'PENDING' && !isPastLeave(l.endDate) && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(l._id)}
                      onChange={() => toggleSelect(l._id)}
                      className="mt-1 rounded border-[hsl(var(--border))] cursor-pointer"
                    />
                  )}
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
                </div>
                <StatusBadge variant={
                  l.status === 'PENDING' && isPastLeave(l.endDate)
                    ? 'neutral'
                    : STATUS_VARIANT[l.status] ?? 'neutral'
                }>
                  {l.status === 'PENDING' && isPastLeave(l.endDate)
                    ? 'EXPIRED'
                    : l.status.replace(/_/g, ' ')}
                </StatusBadge>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{l.reason}</p>

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Submitted {new Date(l.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>

              {l.status === 'PENDING' && !isPastLeave(l.endDate) && (
                <div className="flex gap-2 pt-2">
                  <motion.button
                    onClick={() => void handleApprove(l._id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                  >
                    Approve
                  </motion.button>

                  <AnimatePresence mode="wait">
                  {rejectingId === l._id ? (
                    <motion.div
                      key="reject-form"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex gap-2 items-center flex-1 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:outline-none transition-all"
                      />
                      <motion.button
                        onClick={() => void handleReject(l._id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-3 py-1.5 rounded-xl bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] text-xs font-semibold hover:opacity-90 transition-all whitespace-nowrap"
                      >
                        Confirm
                      </motion.button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors whitespace-nowrap"
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
                      transition={{ duration: 0.2 }}
                      onClick={() => setRejectingId(l._id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-4 py-2 rounded-xl bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] text-sm font-semibold hover:bg-[hsl(var(--destructive))]/18 transition-all"
                    >
                      Reject
                    </motion.button>
                  )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
            )}
          />
        </div>
      )}
    </div>
  );
}
