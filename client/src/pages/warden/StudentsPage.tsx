import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  SCANNED_OUT: 'bg-blue-100 text-blue-800',
  SCANNED_IN: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Leave Management</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Review and approve student leave requests.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SCANNED_OUT">Scanned Out</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : leaves.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No leaves found.</p>
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <div key={l._id} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2">
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] ?? ''}`}>
                  {l.status.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{l.reason}</p>

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Submitted {new Date(l.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>

              {l.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => void handleApprove(l._id)}
                    className="px-4 py-1.5 rounded bg-green-600 text-white text-sm font-medium"
                  >
                    Approve
                  </button>

                  {rejectingId === l._id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => void handleReject(l._id)}
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="text-xs text-[hsl(var(--muted-foreground))]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRejectingId(l._id)}
                      className="px-4 py-1.5 rounded bg-red-100 text-red-700 text-sm font-medium"
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
