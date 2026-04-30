import { useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  CalendarDays,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  Trash2,
} from 'lucide-react';

interface ResourceSlot {
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

interface Resource {
  _id: string;
  key: string;
  label: string;
  description?: string;
  slots: ResourceSlot[];
  capacity: number;
  allowedRoles: string[];
  bookingWindowDays: number;
  isActive: boolean;
}

interface AvailableSlot {
  slotIndex: number;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  available: number;
}

interface MyBooking {
  _id: string;
  resourceKey: string;
  date: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function buildDateOptions(windowDays: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < Math.min(windowDays, 14); i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

export default function BookingsPage() {
  usePageTitle('Bookings');
  const [resources, setResources] = useState<Resource[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [date, setDate] = useState<string>(isoDate(new Date()));
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingIdx, setBookingIdx] = useState<number | null>(null);

  const reload = async () => {
    const [resourcesRes, bookingsRes] = await Promise.all([
      apiFetch<{ resources: Resource[] }>('/resources'),
      apiFetch<{ bookings: MyBooking[] }>('/resource-bookings/me'),
    ]);
    setResources(resourcesRes.data.resources);
    setMyBookings(bookingsRes.data.bookings);
  };

  useEffect(() => {
    reload()
      .catch((err: unknown) => showError(err, 'Failed to load resources'))
      .finally(() => setLoading(false));
  }, []);

  // Reload slots whenever the user picks a new resource or date
  useEffect(() => {
    if (!selected) return;
    setSlotsLoading(true);
    apiFetch<{ slots: AvailableSlot[] }>(`/resources/${selected.key}/slots?date=${date}`)
      .then((res) => setSlots(res.data.slots))
      .catch((err: unknown) => showError(err, 'Failed to load slots'))
      .finally(() => setSlotsLoading(false));
  }, [selected, date]);

  const dateOptions = useMemo(
    () => buildDateOptions(selected?.bookingWindowDays ?? 14),
    [selected],
  );

  async function book(slotIndex: number) {
    if (!selected) return;
    setBookingIdx(slotIndex);
    try {
      await apiFetch(`/resources/${selected.key}/book`, {
        method: 'POST',
        body: JSON.stringify({ date, slotIndex }),
      });
      showSuccess('Booked!');
      // Refresh slots and my bookings
      const [slotsRes, bookingsRes] = await Promise.all([
        apiFetch<{ slots: AvailableSlot[] }>(`/resources/${selected.key}/slots?date=${date}`),
        apiFetch<{ bookings: MyBooking[] }>('/resource-bookings/me'),
      ]);
      setSlots(slotsRes.data.slots);
      setMyBookings(bookingsRes.data.bookings);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Booking failed';
      showError(err, msg);
    } finally {
      setBookingIdx(null);
    }
  }

  async function cancel(bookingId: string) {
    try {
      await apiFetch(`/resource-bookings/${bookingId}`, { method: 'DELETE' });
      showSuccess('Booking cancelled');
      await reload();
      if (selected) {
        const slotsRes = await apiFetch<{ slots: AvailableSlot[] }>(
          `/resources/${selected.key}/slots?date=${date}`,
        );
        setSlots(slotsRes.data.slots);
      }
    } catch (err) {
      showError(err, 'Cancel failed');
    }
  }

  if (loading) return <PageSkeleton />;

  // Detail view: a single resource selected
  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <ChevronLeft className="w-4 h-4" /> All resources
        </button>

        <PageHeader
          title={selected.label}
          description={selected.description ?? 'Pick a date and slot to book.'}
          icon={<CalendarDays className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        />

        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2">
            {dateOptions.map((d) => {
              const v = isoDate(d);
              const active = v === date;
              return (
                <button
                  key={v}
                  onClick={() => setDate(v)}
                  className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-indigo-400'
                  }`}
                >
                  <div className="text-[10px] uppercase opacity-70">{DAY_NAMES[d.getDay()]}</div>
                  <div>{formatDateLabel(d).split(' ').slice(1).join(' ')}</div>
                </button>
              );
            })}
          </div>
        </div>

        <section className="rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">
            Available slots
          </h3>
          {slotsLoading ? (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              No slots scheduled on this day.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slots.map((s) => {
                const full = s.available === 0;
                const busy = bookingIdx === s.slotIndex;
                return (
                  <motion.div
                    key={s.slotIndex}
                    whileHover={!full && !busy ? { y: -2 } : undefined}
                    className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
                      full
                        ? 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 opacity-60'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {s.startTime} – {s.endTime}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                        <Users className="w-3 h-3" />
                        {s.available} of {s.capacity} seats left
                      </div>
                    </div>
                    <button
                      disabled={full || busy}
                      onClick={() => void book(s.slotIndex)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        full
                          ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {busy ? 'Booking...' : full ? 'Full' : 'Book'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Reserve a slot for any activity your hostel offers."
        icon={<CalendarDays className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
      />

      {resources.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            No bookable resources yet
          </h3>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Your warden hasn&apos;t added any. Activities like yoga, gym, or study rooms will show up here once they do.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resources.map((r) => (
            <motion.button
              key={r._id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelected(r);
                setDate(isoDate(new Date()));
              }}
              className="text-left rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 hover:border-indigo-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{r.label}</h3>
                  {r.description && (
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                      {r.description}
                    </p>
                  )}
                </div>
                <CalendarDays className="w-5 h-5 text-indigo-500 shrink-0" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                {r.slots.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                  >
                    {DAY_NAMES[s.dayOfWeek]} {s.startTime}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </section>
      )}

      {myBookings.length > 0 && (
        <section className="rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">
            Your upcoming bookings
          </h3>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {myBookings.map((b) => {
                const dt = new Date(b.date);
                return (
                  <motion.li
                    key={b._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] px-3 py-2"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {b.resourceKey}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDateLabel(dt)} · {b.startTime} – {b.endTime}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => void cancel(b._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Cancel booking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
}
