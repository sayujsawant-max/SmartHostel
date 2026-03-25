import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { MotionCard } from '@/components/motion/MotionCard';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import StatusBadge from '@components/ui/StatusBadge';
import Spinner from '@components/ui/Spinner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';
import SmartRoomMatcher from '@components/SmartRoomMatcher';
import { usePageTitle } from '@hooks/usePageTitle';

interface Room {
  _id: string;
  block: string;
  floor: string;
  roomNumber: string;
  hostelGender: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
}

export default function RoomRequestPage() {
  usePageTitle('Room Request');
  const { user, refreshUser } = useAuth();
  // refreshUser re-fetches /auth/me to update user state after room assignment
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'smart'>('smart');

  const hostelGender = user?.gender === 'MALE' ? 'BOYS' : 'GIRLS';

  useEffect(() => {
    apiFetch<{ rooms: Room[] }>(`/rooms?hostelGender=${hostelGender}`)
      .then((res) => {
        const available = res.data.rooms.filter((r) => r.occupiedBeds < r.totalBeds);
        setRooms(available);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hostelGender]);

  async function handleRequest(roomId: string) {
    setRequesting(roomId);
    setError('');
    try {
      await apiFetch('/rooms/request', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
      setSuccess(true);
      showSuccess('Room assigned successfully!');
      void import('@/utils/confetti').then(m => m.celebrate());
      await refreshUser();
      setTimeout(() => navigate('/student/status'), 1500);
    } catch (err: unknown) {
      showError(err, 'Failed to request room');
    } finally {
      setRequesting(null);
    }
  }

  if (user?.roomNumber) {
    return (
      <MotionCard>
        <div className="p-6 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40 text-center">
          <p className="font-medium text-blue-800 dark:text-blue-200">You already have a room assigned.</p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Block {user.block} · Floor {user.floor} · Room {user.roomNumber}
          </p>
        </div>
      </MotionCard>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Reveal>
          <PageHeader title="Request a Room" description="Browse available rooms and pick one to request." />
        </Reveal>
        <PageSkeleton />
      </div>
    );
  }

  if (success) {
    const reduced = prefersReducedMotion();
    const Wrapper = reduced ? 'div' : motion.div;
    const wrapperProps = reduced
      ? {}
      : {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: 'spring' as const },
        };

    return (
      <Wrapper {...wrapperProps} className="space-y-4">
        <MotionCard>
          <div className="p-6 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">Room assigned successfully!</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Redirecting to your status page...</p>
          </div>
        </MotionCard>
      </Wrapper>
    );
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader title="Request a Room" description="Find your perfect room with AI matching or browse manually." />
      </Reveal>

      {/* Tab Toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-[hsl(var(--muted))]">
        {(['smart', 'browse'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {tab === 'smart' ? '✨ Smart Match' : '📋 Browse All'}
          </button>
        ))}
      </div>

      {activeTab === 'smart' ? (
        <SmartRoomMatcher onSelectRoom={(roomId) => handleRequest(roomId)} />
      ) : (
      <>
      <AnimatePresence>
        {error && (
          <motion.div
            key="room-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ErrorBanner message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      {rooms.length === 0 ? (
        <EmptyState
          variant="compact"
          title="No rooms available"
          description="Please check back later or contact the warden."
        />
      ) : (
        <StaggerContainer stagger={0.06} className="grid gap-3">
          {rooms.map((room) => {
            const availableBeds = room.totalBeds - room.occupiedBeds;
            return (
              <StaggerItem key={room._id}>
              <div
                className="relative overflow-hidden p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors card-glow"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[hsl(var(--foreground))]">
                    Room {room.roomNumber}
                  </p>
                  <StatusBadge variant="success">
                    {availableBeds} bed{availableBeds !== 1 ? 's' : ''} free
                  </StatusBadge>
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-0.5">
                  <p>Block {room.block} · Floor {room.floor}</p>
                  <p>{room.roomType} · {room.acType.replace('_', ' ')}</p>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    Rs. {room.feePerSemester.toLocaleString('en-IN')} / semester
                  </p>
                </div>
                <button
                  onClick={() => handleRequest(room._id)}
                  disabled={requesting !== null}
                  className="w-full mt-1 py-2 px-4 rounded-lg text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {requesting === room._id && <Spinner size="h-4 w-4" />}
                  {requesting === room._id ? 'Requesting...' : 'Request This Room'}
                </button>
              </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
      </>
      )}
    </div>
  );
}
