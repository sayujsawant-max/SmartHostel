import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { MotionCard } from '@/components/motion/MotionCard';
import { motion } from 'motion/react';
import { transition } from '@/utils/motion';
import { CardSkeleton, StatSkeleton } from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
import ErrorBanner from '@components/ui/ErrorBanner';
import StatCard from '@components/ui/StatCard';
import StatusBadge from '@components/ui/StatusBadge';
import FilterPanel from '@components/ui/FilterPanel';
import ThemeToggle from '@components/ThemeToggle';
import { Search, BedDouble } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────── */

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
  photos: string[];
}

interface Availability {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  byHostel: Record<string, { total: number; occupied: number; available: number }>;
  byType: Record<string, { total: number; occupied: number; available: number }>;
}

/* ─── Constants ─────────────────────────────────────────────────── */

const HOSTEL_BG: Record<string, string> = {
  BOYS: 'from-blue-500 to-blue-700',
  GIRLS: 'from-pink-500 to-pink-700',
};

const ROOM_PHOTOS: Record<string, string> = {
  DELUXE_AC: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=250&fit=crop',
  DELUXE_NON_AC: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=250&fit=crop',
  NORMAL_AC: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop',
  NORMAL_NON_AC: 'https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=400&h=250&fit=crop',
};

/* ─── Component ─────────────────────────────────────────────────── */

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGender, setFilterGender] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAc, setFilterAc] = useState('');

  function loadData() {
    const params = new URLSearchParams();
    if (filterGender) params.set('hostelGender', filterGender);
    if (filterType) params.set('roomType', filterType);
    if (filterAc) params.set('acType', filterAc);

    setError(null);
    setLoading(true);
    Promise.all([
      fetch(`/api/rooms?${params}`).then((r) => r.json()),
      fetch('/api/rooms/availability').then((r) => r.json()),
    ])
      .then(([roomsRes, availRes]) => {
        setRooms(roomsRes.data?.rooms ?? []);
        setAvailability(availRes.data?.availability ?? null);
      })
      .catch(() => {
        setError('Failed to load room data. Please try again.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGender, filterType, filterAc]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={transition.normal}
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10"
        style={{
          background:
            'linear-gradient(135deg, hsl(222 47% 19%) 0%, hsl(173 78% 24%) 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              SmartHostel
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div
        className="pt-12 pb-10 text-center"
        style={{
          background:
            'linear-gradient(180deg, hsl(222 47% 19%) 0%, hsl(var(--background)) 100%)',
        }}
      >
        <Reveal direction="none">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Rooms &amp; Availability
          </h1>
          <p className="text-white/60 mt-2 text-base">
            Browse rooms, check availability &amp; compare fees
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* ── Availability stats ─────────────────────────────────── */}
        {loading && !availability ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-6 mb-8">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        ) : availability ? (
          <Reveal className="-mt-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                value={availability.availableBeds}
                label="Beds Available"
                accent
              />
              <StatCard
                value={availability.totalBeds}
                label="Total Beds"
              />
              {Object.entries(availability.byHostel).map(([key, val]) => (
                <StatCard
                  key={key}
                  value={val.available}
                  label={`${key} Available`}
                />
              ))}
            </div>
          </Reveal>
        ) : null}

        {/* ── Filters ───────────────────────────────────────────── */}
        <Reveal delay={0.05} className="mb-8">
          <FilterPanel>
            <FilterPanel.Select value={filterGender} onChange={setFilterGender}>
              <option value="">All Hostels</option>
              <option value="BOYS">Boys Hostel</option>
              <option value="GIRLS">Girls Hostel</option>
            </FilterPanel.Select>
            <FilterPanel.Select value={filterType} onChange={setFilterType}>
              <option value="">All Room Types</option>
              <option value="DELUXE">Deluxe</option>
              <option value="NORMAL">Normal</option>
            </FilterPanel.Select>
            <FilterPanel.Select value={filterAc} onChange={setFilterAc}>
              <option value="">AC &amp; Non-AC</option>
              <option value="AC">AC Only</option>
              <option value="NON_AC">Non-AC Only</option>
            </FilterPanel.Select>
          </FilterPanel>
        </Reveal>

        {/* ── Room cards ────────────────────────────────────────── */}
        <div className="pb-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorBanner
              variant="block"
              message={error}
              onRetry={loadData}
            />
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={<Search className="w-12 h-12" />}
              title="No rooms found"
              description="Try adjusting your filters to see more results."
            />
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4" stagger={0.05}>
              {rooms.map((room) => (
                <StaggerItem key={room._id}>
                  <RoomCard room={room} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>

      {/* ── Footer links ────────────────────────────────────────── */}
      <footer className="border-t border-[hsl(var(--border))]/60 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <Link to="/landing" className="hover:text-[hsl(var(--foreground))] transition-colors">
            Home
          </Link>
          <span className="text-[hsl(var(--border))]">|</span>
          <Link to="/login" className="hover:text-[hsl(var(--foreground))] transition-colors">
            Sign In
          </Link>
          <span className="text-[hsl(var(--border))]">|</span>
          <Link to="/register" className="hover:text-[hsl(var(--foreground))] transition-colors">
            Create Account
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ─── Room card ─────────────────────────────────────────────────── */

function RoomCard({ room }: { room: Room }) {
  const bedsLeft = room.totalBeds - room.occupiedBeds;
  const photoKey = `${room.roomType}_${room.acType}`;
  const photo = room.photos[0] || ROOM_PHOTOS[photoKey] || ROOM_PHOTOS.NORMAL_NON_AC;
  const occupancyPct = (room.occupiedBeds / room.totalBeds) * 100;

  return (
    <MotionCard>
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={photo}
            alt={`Room ${room.roomNumber}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Hostel badge */}
          <div
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${HOSTEL_BG[room.hostelGender] || 'from-gray-500 to-gray-700'}`}
          >
            {room.hostelGender} Hostel
          </div>

          {/* Type badges */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5">
            <StatusBadge variant={room.acType === 'AC' ? 'info' : 'neutral'}>
              {room.acType === 'AC' ? 'AC' : 'Non-AC'}
            </StatusBadge>
            <StatusBadge variant={room.roomType === 'DELUXE' ? 'warning' : 'neutral'}>
              {room.roomType}
            </StatusBadge>
          </div>

          {/* Bed availability pill */}
          <div className="absolute bottom-2.5 left-2.5">
            <StatusBadge
              className={`${bedsLeft > 0 ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'} backdrop-blur-sm`}
            >
              <BedDouble className="w-3 h-3 mr-1" />
              {bedsLeft > 0
                ? `${bedsLeft} bed${bedsLeft > 1 ? 's' : ''} left`
                : 'Full'}
            </StatusBadge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-[hsl(var(--foreground))]">
                Block {room.block} &mdash; Room {room.roomNumber}
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Floor {room.floor}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[hsl(var(--accent))]">
                &#8377;{room.feePerSemester.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                per semester
              </p>
            </div>
          </div>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[hsl(var(--muted-foreground))]">Occupancy</span>
              <span className="text-[hsl(var(--muted-foreground))]">
                {room.occupiedBeds}/{room.totalBeds} beds
              </span>
            </div>
            <div className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className={`h-full rounded-full ${bedsLeft > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </MotionCard>
  );
}
