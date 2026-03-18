import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { AnimatePresence, motion } from 'motion/react';

interface Room {
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

interface RoomChangeRequest {
  _id: string;
  currentRoomId: PopulatedRoom;
  requestedRoomId: PopulatedRoom;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  rejectionReason?: string;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  COMPLETED: 'info',
};

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

function formatRoom(r: PopulatedRoom): string {
  return `Block ${r.block} / Floor ${r.floor} / Room ${r.roomNumber}`;
}

export default function RoomChangePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requests, setRequests] = useState<RoomChangeRequest[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await apiFetch<{ rooms: Room[] }>('/rooms');
      const available = res.data.rooms.filter((r) => r.totalBeds > r.occupiedBeds);
      setRooms(available);
    } catch {
      // silently fail
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiFetch<{ requests: RoomChangeRequest[] }>('/room-changes/my');
      setRequests(res.data.requests);
    } catch {
      // silently fail
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    void fetchRooms();
    void fetchRequests();
  }, [fetchRooms, fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRoomId) {
      setError('Please select a room');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/room-changes', {
        method: 'POST',
        body: JSON.stringify({ requestedRoomId: selectedRoomId, reason: reason.trim() }),
      });
      setSuccess('Room change request submitted successfully');
      setSelectedRoomId('');
      setReason('');
      void fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Request Room Change"
          description="Select an available room and provide a reason for your request."
        />
      </Reveal>

      <Reveal delay={0.1}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* Room Selection */}
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
            Select Room
          </label>
          {loadingRooms ? (
            <PageSkeleton />
          ) : rooms.length === 0 ? (
            <EmptyState variant="compact" title="No rooms available" description="No rooms with available beds at this time." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {rooms.map((room) => (
                <button
                  key={room._id}
                  type="button"
                  onClick={() => setSelectedRoomId(room._id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors hover:shadow-sm ${
                    selectedRoomId === room._id
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <p className="font-medium">
                    Block {room.block} - Room {room.roomNumber}
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    Floor {room.floor} | {room.roomType} | {room.acType}
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {room.totalBeds - room.occupiedBeds} bed{room.totalBeds - room.occupiedBeds !== 1 ? 's' : ''} available
                    {' | '}Rs. {room.feePerSemester.toLocaleString('en-IN')}/sem
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected room detail */}
        {selectedRoom && (
          <div className="p-3 rounded-lg bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))]">
            <p className="font-medium">Selected: Block {selectedRoom.block} - Room {selectedRoom.roomNumber}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              Floor {selectedRoom.floor} | {selectedRoom.roomType} | {selectedRoom.acType} |{' '}
              {selectedRoom.totalBeds - selectedRoom.occupiedBeds} beds available |{' '}
              Rs. {selectedRoom.feePerSemester.toLocaleString('en-IN')}/sem
            </p>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Why do you want to change your room?"
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{reason.length}/500</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div key="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ErrorBanner message={error} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div key="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800/40 dark:text-green-300 text-sm">
                {success}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? 'Submitting...' : 'Submit Room Change Request'}
        </button>
      </form>
      </Reveal>

      {/* Divider */}
      <hr className="border-[hsl(var(--border))]" />

      {/* My Requests */}
      <Reveal delay={0.15}>
        <PageHeader
          title="My Requests"
          description="Track the status of your room change requests."
        />
      </Reveal>

      {loadingRequests ? (
        <PageSkeleton />
      ) : requests.length === 0 ? (
        <EmptyState variant="compact" title="No requests yet" description="Submit a room change request above." />
      ) : (
        <StaggerContainer stagger={0.06} className="space-y-3">
          {requests.map((r) => (
            <StaggerItem key={r._id}>
            <div
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="text-sm text-[hsl(var(--foreground))]">
                  <span>{formatRoom(r.currentRoomId)}</span>
                  <span className="mx-2 text-[hsl(var(--muted-foreground))]">&rarr;</span>
                  <span>{formatRoom(r.requestedRoomId)}</span>
                </div>
                <StatusBadge variant={STATUS_VARIANT[r.status] ?? 'neutral'}>
                  {r.status}
                </StatusBadge>
              </div>

              <p className="text-sm text-[hsl(var(--muted-foreground))]">{r.reason}</p>

              {r.status === 'REJECTED' && r.rejectionReason && (
                <p className="text-sm text-[hsl(var(--destructive))]">Rejection reason: {r.rejectionReason}</p>
              )}

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {new Date(r.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
