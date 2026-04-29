import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '@/utils/motion';
import { CardSkeleton, StatSkeleton } from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
import ErrorBanner from '@components/ui/ErrorBanner';
import StatusBadge from '@components/ui/StatusBadge';
import ThemeToggle from '@components/ThemeToggle';
import { Search, BedDouble, Building2, Users, DoorOpen, ArrowRight, Sparkles, X } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

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

const ROOM_GRADIENTS: Record<string, string> = {
  DELUXE_AC: 'from-amber-400 via-orange-500 to-rose-500',
  DELUXE_NON_AC: 'from-purple-500 via-pink-500 to-rose-500',
  NORMAL_AC: 'from-cyan-400 via-blue-500 to-indigo-600',
  NORMAL_NON_AC: 'from-emerald-400 via-teal-500 to-cyan-600',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

const STAT_ICONS = [DoorOpen, BedDouble, Building2, Users];

/* ─── Filter select ───────────────────────────────────────────── */

function FilterSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  const hasValue = value !== '';
  return (
    <div className="relative">
      <motion.select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2.5 pr-8 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer ${
          hasValue
            ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
            : 'border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]'
        }`}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        aria-label={label}
      >
        {children}
      </motion.select>
      <AnimatePresence>
        {hasValue && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm hover:bg-indigo-700 transition-colors"
            aria-label={`Clear ${label}`}
          >
            <X className="w-2.5 h-2.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────── */

export default function RoomsPage() {
  usePageTitle('Rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGender, setFilterGender] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAc, setFilterAc] = useState('');

  const activeFilterCount = [filterGender, filterType, filterAc].filter(Boolean).length;

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
      .catch((err: unknown) => {
        showError(err, 'Failed to load room data');
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
        initial={{ y: -60, opacity: 0, filter: 'blur(6px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={transition.normal}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/90 border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5 group">
            <motion.div
              className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight">SmartHostel</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
            >
              <Link
                to="/register"
                className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25 inline-block"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-transparent" />

        {/* Animated gradient shimmer */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(120deg, transparent 30%, rgba(99,102,241,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-indigo-600/15 blur-[100px]"
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-purple-600/10 blur-[100px]"
            animate={{ x: [0, -15, 10, 0], y: [0, 10, -15, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative pt-16 pb-14 text-center">
          <Reveal direction="none">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300 mb-6 backdrop-blur-sm"
              whileHover={{ scale: 1.04, borderColor: 'rgba(255,255,255,0.25)' }}
              transition={spring}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </motion.span>
              Browse &amp; Compare
            </motion.div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-white">Rooms &amp; </span>
              <motion.span
                className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                Availability
              </motion.span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-slate-400 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
              Browse rooms, check real-time availability &amp; compare fees across hostels
            </p>
          </Reveal>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3" stagger={0.08}>
              {[
                { value: availability.availableBeds, label: 'Beds Available', accent: true },
                { value: availability.totalBeds, label: 'Total Beds', accent: false },
                ...Object.entries(availability.byHostel).map(([key, val]) => ({
                  value: val.available,
                  label: `${key} Available`,
                  accent: false,
                })),
              ].map((stat, i) => {
                const Icon = STAT_ICONS[i] || BedDouble;
                return (
                  <StaggerItem key={stat.label}>
                    <motion.div
                      className={`rounded-xl p-4 border transition-shadow ${
                        stat.accent
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:shadow-md card-glow'
                      }`}
                      whileHover={{ scale: 1.04, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            stat.accent
                              ? 'bg-white/20'
                              : 'bg-indigo-50 dark:bg-indigo-950/50'
                          }`}
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.4 }}
                        >
                          <Icon className={`w-5 h-5 ${
                            stat.accent ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                          }`} />
                        </motion.div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            stat.accent ? 'text-white' : 'text-[hsl(var(--foreground))]'
                          }`}>
                            <AnimatedCounter to={stat.value} duration={1.2} />
                          </p>
                          <p className={`text-xs font-medium ${
                            stat.accent ? 'text-indigo-200' : 'text-[hsl(var(--muted-foreground))]'
                          }`}>
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </Reveal>
        ) : null}

        {/* ── Filters ───────────────────────────────────────────── */}
        <Reveal delay={0.05} className="mb-8">
          <motion.div
            className="flex flex-wrap gap-3 items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 card-glow"
            layout
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] pl-1">
              <Search className="w-4 h-4" />
              <span>Filters</span>
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <FilterSelect value={filterGender} onChange={setFilterGender} label="Hostel filter">
              <option value="">All Hostels</option>
              <option value="BOYS">Boys Hostel</option>
              <option value="GIRLS">Girls Hostel</option>
            </FilterSelect>
            <FilterSelect value={filterType} onChange={setFilterType} label="Room type filter">
              <option value="">All Room Types</option>
              <option value="DELUXE">Deluxe</option>
              <option value="NORMAL">Normal</option>
            </FilterSelect>
            <FilterSelect value={filterAc} onChange={setFilterAc} label="AC filter">
              <option value="">AC &amp; Non-AC</option>
              <option value="AC">AC Only</option>
              <option value="NON_AC">Non-AC Only</option>
            </FilterSelect>

            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setFilterGender('');
                    setFilterType('');
                    setFilterAc('');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-auto"
                >
                  Clear all
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </Reveal>

        {/* ── Room results ────────────────────────────────────────── */}
        <div className="pb-16">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ErrorBanner
                  variant="block"
                  message={error}
                  onRetry={loadData}
                />
              </motion.div>
            ) : rooms.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <EmptyState
                  icon={<Search className="w-12 h-12" />}
                  title="No rooms found"
                  description="Try adjusting your filters to see more results."
                />
              </motion.div>
            ) : (
              <motion.div
                key={`rooms-${filterGender}-${filterType}-${filterAc}`}
                initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.p
                    className="text-sm text-[hsl(var(--muted-foreground))]"
                    key={rooms.length}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Showing <span className="font-semibold text-[hsl(var(--foreground))]">{rooms.length}</span> room{rooms.length !== 1 ? 's' : ''}
                  </motion.p>
                </div>
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4" stagger={0.06}>
                  {rooms.map((room) => (
                    <StaggerItem key={room._id}>
                      <RoomCard room={room} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent" />
        <div className="relative border-t border-white/10 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <Link to="/landing" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span className="text-white/20">|</span>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
                <span className="text-white/20">|</span>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </div>
              <motion.div
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
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
  const gradient = ROOM_GRADIENTS[photoKey] || ROOM_GRADIENTS.NORMAL_NON_AC;
  const [imgError, setImgError] = useState(false);
  const occupancyPct = (room.occupiedBeds / room.totalBeds) * 100;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.012 }}
      transition={spring}
      className="group"
    >
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden shadow-sm group-hover:shadow-lg group-hover:border-indigo-500/20 transition-all duration-300 card-glow">
        {/* Image */}
        <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${gradient}`}>
          {!imgError && (
            <img
              src={photo}
              alt={`Room ${room.roomNumber}`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          {imgError && (
            <div className="w-full h-full flex items-center justify-center">
              <BedDouble className="w-16 h-16 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Shimmer overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
          </div>

          {/* Hostel badge */}
          <div
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${HOSTEL_BG[room.hostelGender] || 'from-gray-500 to-gray-700'} shadow-sm`}
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
              <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Block {room.block} &mdash; Room {room.roomNumber}
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Floor {room.floor}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                &#8377;{room.feePerSemester.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                per semester
              </p>
            </div>
          </div>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[hsl(var(--muted-foreground))]">Occupancy</span>
              <span className="text-[hsl(var(--muted-foreground))]">
                {room.occupiedBeds}/{room.totalBeds} beds
              </span>
            </div>
            <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={`h-full rounded-full ${
                  bedsLeft > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
