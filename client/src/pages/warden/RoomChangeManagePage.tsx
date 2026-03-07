import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

interface PopulatedRoom {
  _id: string;
  block: string;
  floor: string;
  roomNumber: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
}

interface PopulatedStudent {
  _id: string;
  name: string;
  email: string;
  block?: string;
  floor?: string;
  roomNumber?: string;
}

interface PopulatedReviewer {
  _id: string;
  name: string;
}

interface RoomChangeRequest {
  _id: string;
  studentId: PopulatedStudent;
  currentRoomId: PopulatedRoom;
  requestedRoomId: PopulatedRoom;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reviewedBy?: PopulatedReviewer;
  reviewedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

function formatRoom(r: PopulatedRoom): string {
  return `Block ${r.block} / Floor ${r.floor} / Room ${r.roomNumber}`;
}

export default function RoomChangeManagePage() {
  const [requests, setRequests] = useState<RoomChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiFetch<{ requests: RoomChangeRequest[] }>('/room-changes');
      setRequests(res.data.requests);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/room-changes/${id}/approve`, { method: 'PATCH' });
      void fetchRequests();
    } catch {
      // silently fail
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    try {
      await apiFetch(`/room-changes/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setRejectingId(null);
      setRejectReason('');
      void fetchRequests();
    } catch {
      // silently fail
    }
  };

  const filtered = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Room Change Requests</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Review and manage student room change requests.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No room change requests found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r._id}
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {r.studentId.name}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {r.studentId.email}
                    {r.studentId.block && (
                      <span className="ml-1 opacity-60">
                        Block {r.studentId.block}
                        {r.studentId.roomNumber && ` / Room ${r.studentId.roomNumber}`}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? ''}`}
                >
                  {r.status}
                </span>
              </div>

              {/* Room Change Details */}
              <div className="text-sm text-[hsl(var(--foreground))]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded bg-[hsl(var(--muted))] text-xs">
                    {formatRoom(r.currentRoomId)} ({r.currentRoomId.roomType}, {r.currentRoomId.acType})
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-[hsl(var(--muted))] text-xs">
                    {formatRoom(r.requestedRoomId)} ({r.requestedRoomId.roomType}, {r.requestedRoomId.acType})
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Fee: Rs. {r.currentRoomId.feePerSemester.toLocaleString('en-IN')} &rarr;{' '}
                  Rs. {r.requestedRoomId.feePerSemester.toLocaleString('en-IN')}/sem
                </p>
              </div>

              {/* Reason */}
              <p className="text-sm text-[hsl(var(--foreground))]">{r.reason}</p>

              {/* Rejection Reason */}
              {r.status === 'REJECTED' && r.rejectionReason && (
                <p className="text-sm text-red-600">Rejection reason: {r.rejectionReason}</p>
              )}

              {/* Meta */}
              <div className="text-xs text-[hsl(var(--muted-foreground))] flex gap-3">
                <span>
                  {new Date(r.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {r.reviewedBy && <span>Reviewed by: {r.reviewedBy.name}</span>}
              </div>

              {/* Actions for PENDING requests */}
              {r.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  {rejectingId === r._id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-[hsl(var(--foreground))]"
                      />
                      <button
                        onClick={() => void handleReject(r._id)}
                        disabled={!rejectReason.trim()}
                        className="px-3 py-1 rounded bg-[hsl(var(--destructive))] text-white text-xs font-medium disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        className="px-2 py-1 text-xs text-[hsl(var(--muted-foreground))]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => void handleApprove(r._id)}
                        className="px-3 py-1 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(r._id)}
                        className="px-3 py-1 rounded bg-[hsl(var(--destructive))] text-white text-xs font-medium"
                      >
                        Reject
                      </button>
                    </>
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
