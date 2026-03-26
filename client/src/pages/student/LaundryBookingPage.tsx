import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion } from '@components/ui/motion';
import { Reveal } from '@/components/motion';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  Shirt,
  Clock,
  CircleDollarSign,
  Gauge,
  Check,
  X,
  AlertTriangle,
  WashingMachine,
  CalendarDays,
} from 'lucide-react';

interface SlotData {
  _id: string;
  machineNumber: number;
  date: string;
  timeSlot: string;
  bookedBy: { _id: string; name: string; email: string } | null;
  status: 'AVAILABLE' | 'BOOKED' | 'IN_USE' | 'COMPLETED' | 'CANCELLED';
}

interface MyBooking {
  _id: string;
  machineNumber: number;
  date: string;
  timeSlot: string;
  status: string;
}

interface MachineStatus {
  number: number;
  maintenance: boolean;
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const start = (i + 6).toString().padStart(2, '0');
  const end = (i + 7).toString().padStart(2, '0');
  return `${start}:00-${end}:00`;
});

const MACHINES: MachineStatus[] = [
  { number: 1, maintenance: false },
  { number: 2, maintenance: false },
  { number: 3, maintenance: false },
  { number: 4, maintenance: false },
  { number: 5, maintenance: false },
];

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateShort(iso: string): { day: string; date: number } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    date: d.getDate(),
  };
}

function formatTimeLabel(ts: string): { hour: string; range: string } {
  const start = parseInt(ts.split(':')[0], 10);
  const ampm = start >= 12 ? 'PM' : 'AM';
  const h = start > 12 ? start - 12 : start === 0 ? 12 : start;
  return {
    hour: `${h} ${ampm}`,
    range: ts,
  };
}

function isSlotPast(dateStr: string, timeSlot: string): boolean {
  const now = new Date();
  const endHour = parseInt(timeSlot.split('-')[1], 10);
  const slotEnd = new Date(dateStr);
  slotEnd.setHours(endHour, 0, 0, 0);
  return now > slotEnd;
}

const STAT_CARDS = [
  {
    icon: CircleDollarSign,
    value: '₹30',
    label: 'Per wash cycle',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  {
    icon: Clock,
    value: '1 Hour',
    label: 'Cycle duration',
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/40',
    cardBg: 'bg-blue-50/50 dark:bg-blue-950/20',
  },
  {
    icon: Gauge,
    value: '2 Max',
    label: 'Active bookings',
    bg: 'bg-violet-100 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800/40',
    cardBg: 'bg-violet-50/50 dark:bg-violet-950/20',
  },
];

export default function LaundryBookingPage() {
  usePageTitle('Laundry Booking');
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);

  // Build date options: today + 6 days ahead
  const dateOptions: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push(toDateString(d));
  }

  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        apiFetch<SlotData[]>(`/laundry?date=${date}`),
        apiFetch<MyBooking[]>('/laundry/my-bookings'),
      ]);
      setSlots(Array.isArray(slotsRes.data) ? slotsRes.data : []);
      setMyBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);

      const mySlot = (Array.isArray(slotsRes.data) ? slotsRes.data : []).find(
        (s) => s.bookedBy && bookingsRes.data.some((b) => b._id === s._id),
      );
      if (mySlot?.bookedBy) {
        setCurrentUserId(mySlot.bookedBy._id);
      }
    } catch (err: unknown) {
      showError(err, 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleBook = async (machineNumber: number, timeSlot: string) => {
    const key = `${machineNumber}-${timeSlot}`;
    if (actionInFlight) return;
    setActionInFlight(key);
    try {
      await apiFetch('/laundry/book', {
        method: 'POST',
        body: JSON.stringify({ machineNumber, date: selectedDate, timeSlot }),
      });
      await fetchSlots(selectedDate);
      showSuccess('Slot booked successfully');
    } catch (err: unknown) {
      showError(err, 'Booking failed');
    } finally {
      setActionInFlight(null);
    }
  };

  const handleCancel = async (slotId: string) => {
    if (actionInFlight) return;
    setActionInFlight(slotId);
    try {
      await apiFetch(`/laundry/${slotId}`, { method: 'DELETE' });
      await fetchSlots(selectedDate);
      showSuccess('Booking cancelled');
    } catch (err: unknown) {
      showError(err, 'Cancel failed');
    } finally {
      setActionInFlight(null);
    }
  };

  function getSlot(machine: number, timeSlot: string): SlotData | undefined {
    return slots.find((s) => s.machineNumber === machine && s.timeSlot === timeSlot);
  }

  function isMySlot(slot: SlotData | undefined): boolean {
    if (!slot?.bookedBy) return false;
    if (currentUserId) return slot.bookedBy._id === currentUserId;
    return myBookings.some((b) => b._id === slot._id);
  }

  // Derive machine maintenance status from slots
  const machineStatuses: MachineStatus[] = MACHINES.map((m) => {
    const machineSlots = slots.filter((s) => s.machineNumber === m.number);
    const allOut = machineSlots.length > 0 && machineSlots.every(
      (s) => s.status !== 'AVAILABLE' && s.status !== 'BOOKED' && s.status !== 'IN_USE' && s.status !== 'COMPLETED',
    );
    return { number: m.number, maintenance: allOut && machineSlots.length > 0 };
  });

  const filteredMachines = selectedMachine
    ? MACHINES.filter((m) => m.number === selectedMachine)
    : MACHINES;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader
          title={<span className="gradient-heading">Laundry Booking</span>}
          description="Reserve your preferred washing machine slot"
        />
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2.5">
        {STAT_CARDS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`flex items-center gap-2.5 p-3 rounded-xl border card-shine ${stat.border} ${stat.cardBg}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.text}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className={`text-base font-bold ${stat.text} leading-tight`}>{stat.value}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight truncate">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Date Picker */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none"
      >
        {dateOptions.map((d) => {
          const { day, date } = formatDateShort(d);
          const isActive = selectedDate === d;
          const isToday = d === toDateString(new Date());
          return (
            <motion.button
              key={d}
              onClick={() => setSelectedDate(d)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              className={`relative flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 min-w-[56px] ${
                isActive
                  ? 'text-white'
                  : isToday
                    ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] ring-1 ring-indigo-400/50'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="laundry-date-pill"
                  className="absolute inset-0 rounded-xl bg-indigo-600 dark:bg-indigo-500"
                  transition={spring}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="text-[10px] uppercase tracking-wide opacity-80">{day}</span>
              <span className="text-lg font-bold leading-tight">{date}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {loading ? (
        <PageSkeleton />
      ) : (
        <>
          {/* Machine Availability */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow"
          >
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <WashingMachine className="w-4 h-4 text-indigo-500" />
              Machine Availability
            </h3>
            <div className="flex flex-wrap gap-2">
              {machineStatuses.map((m, i) => {
                const isSelected = selectedMachine === m.number;
                return (
                  <motion.button
                    key={m.number}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    whileHover={m.maintenance ? {} : { scale: 1.05 }}
                    whileTap={m.maintenance ? {} : { scale: 0.95 }}
                    onClick={() => {
                      if (m.maintenance) return;
                      setSelectedMachine(isSelected ? null : m.number);
                    }}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      m.maintenance
                        ? 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-indigo-100 border border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-400 hover:shadow-sm'
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    Machine {m.number}
                    {m.maintenance && (
                      <motion.span
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200/60 dark:bg-amber-800/40"
                      >
                        Maintenance
                      </motion.span>
                    )}
                    {isSelected && (
                      <motion.div
                        layoutId="machine-selected"
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center"
                        transition={spring}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Slot Grid — Card rows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="space-y-2.5"
          >
            {TIME_SLOTS.map((ts, rowIdx) => {
              const past = isSlotPast(selectedDate, ts);
              const { hour, range } = formatTimeLabel(ts);

              return (
                <motion.div
                  key={ts}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.03 * rowIdx, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] transition-opacity ${
                    past ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Time label */}
                    <div className="w-16 shrink-0">
                      <p className="text-sm font-bold text-[hsl(var(--foreground))] leading-tight">{hour}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{range}</p>
                    </div>

                    {/* Machine slots */}
                    <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${filteredMachines.length}, 1fr)` }}>
                      {filteredMachines.map((m) => {
                        const slot = getSlot(m.number, ts);
                        const mine = isMySlot(slot);
                        const booked = slot?.status === 'BOOKED' || slot?.status === 'IN_USE';
                        const available = slot?.status === 'AVAILABLE';
                        const inFlight = actionInFlight === `${m.number}-${ts}` || actionInFlight === slot?._id;
                        const isMaintenance = machineStatuses.find((ms) => ms.number === m.number)?.maintenance;

                        if (past) {
                          return (
                            <div
                              key={m.number}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]"
                            >
                              <span className="text-[10px]">{booked ? 'Done' : '-'}</span>
                            </div>
                          );
                        }

                        if (isMaintenance) {
                          return (
                            <div
                              key={m.number}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-amber-50/50 border border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-800/30"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Out</span>
                            </div>
                          );
                        }

                        if (mine && slot) {
                          return (
                            <motion.div
                              key={m.number}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-indigo-100 border border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-700"
                              whileHover={{ scale: 1.03 }}
                              transition={spring}
                            >
                              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Mine</span>
                              {slot.status === 'BOOKED' && (
                                <motion.button
                                  onClick={() => void handleCancel(slot._id)}
                                  disabled={!!inFlight}
                                  whileTap={{ scale: 0.9 }}
                                  className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                                >
                                  {inFlight ? '...' : 'Cancel'}
                                </motion.button>
                              )}
                            </motion.div>
                          );
                        }

                        if (booked) {
                          return (
                            <div
                              key={m.number}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))]"
                            >
                              <X className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                              <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Booked</span>
                            </div>
                          );
                        }

                        if (available) {
                          return (
                            <motion.button
                              key={m.number}
                              onClick={() => void handleBook(m.number, ts)}
                              disabled={!!actionInFlight}
                              whileHover={{ scale: 1.06, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              transition={spring}
                              className="flex flex-col items-center justify-center py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {inFlight ? '...' : `M${m.number}`}
                              </span>
                            </motion.button>
                          );
                        }

                        return (
                          <div
                            key={m.number}
                            className="flex flex-col items-center justify-center py-2 rounded-xl bg-[hsl(var(--muted))]/40 opacity-60"
                          >
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {slot?.status ?? '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* My Bookings */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <CalendarDays className="w-4.5 h-4.5 text-indigo-500" />
              My Upcoming Bookings
            </h3>
            {myBookings.length === 0 ? (
              <EmptyState variant="compact" title="No active bookings" description="Book a slot from the grid above." />
            ) : (
              <div className="space-y-2">
                {myBookings.map((b, i) => (
                  <motion.div
                    key={b._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.06 * i }}
                  >
                    <motion.div
                      whileHover={{ x: 3, scale: 1.005 }}
                      transition={spring}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-sm transition-shadow duration-200 card-shine"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                          <Shirt className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                            Machine {b.machineNumber} &middot; {b.timeSlot}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDate(b.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge variant={b.status === 'BOOKED' ? 'info' : b.status === 'IN_USE' ? 'warning' : 'neutral'}>
                          {b.status.replace(/_/g, ' ')}
                        </StatusBadge>
                        {b.status === 'BOOKED' && (
                          <motion.button
                            onClick={() => void handleCancel(b._id)}
                            disabled={actionInFlight === b._id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
                          >
                            {actionInFlight === b._id ? 'Cancelling...' : 'Cancel'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
