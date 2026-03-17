import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const start = (i + 6).toString().padStart(2, '0');
  const end = (i + 7).toString().padStart(2, '0');
  return `${start}:00-${end}:00`;
});

const MACHINES = [1, 2, 3, 4, 5];

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isSlotPast(dateStr: string, timeSlot: string): boolean {
  const now = new Date();
  const endHour = parseInt(timeSlot.split('-')[1], 10);
  const slotEnd = new Date(dateStr);
  slotEnd.setHours(endHour, 0, 0, 0);
  return now > slotEnd;
}

export default function LaundryBookingPage() {
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Build date options: today + 6 days ahead
  const dateOptions: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push(toDateString(d));
  }

  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    setError('');
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        apiFetch<SlotData[]>(`/laundry?date=${date}`),
        apiFetch<MyBooking[]>('/laundry/my-bookings'),
      ]);
      setSlots(slotsRes.data);
      setMyBookings(bookingsRes.data);

      // Derive current user ID from bookings or slot data
      if (bookingsRes.data.length > 0) {
        // We can't get user ID from my-bookings directly — use slot data
      }
      const mySlot = slotsRes.data.find(
        (s) => s.bookedBy && bookingsRes.data.some((b) => b._id === s._id),
      );
      if (mySlot?.bookedBy) {
        setCurrentUserId(mySlot.bookedBy._id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Laundry Booking</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Book a washing machine slot. Max 2 active bookings.
        </p>
      </div>

      {/* Pricing Info */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Pricing</h3>
          <span className="rounded-md bg-[hsl(var(--accent))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--foreground))]">
            ₹30 per wash cycle
          </span>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Laundry service is subsidized by the hostel. Each wash cycle costs ₹30, billed monthly to your hostel account.
        </p>
        <ul className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
          <li>• Max 2 active bookings</li>
          <li>• Cancel at least 1 hour before slot</li>
          <li>• 1-hour wash cycle per slot</li>
        </ul>
      </div>

      {/* Date Picker */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {dateOptions.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDate === d
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {formatDate(d)}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline text-xs">
            dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading slots...</p>
      ) : (
        <>
          {/* Machine Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-[hsl(var(--background))] p-2 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                    Time
                  </th>
                  {MACHINES.map((m) => (
                    <th
                      key={m}
                      className="p-2 text-center text-xs font-semibold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]"
                    >
                      Machine {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((ts) => {
                  const past = isSlotPast(selectedDate, ts);
                  return (
                    <tr key={ts}>
                      <td className="sticky left-0 bg-[hsl(var(--background))] p-2 text-xs font-medium text-[hsl(var(--foreground))] border-b border-[hsl(var(--border))] whitespace-nowrap">
                        {ts}
                      </td>
                      {MACHINES.map((m) => {
                        const slot = getSlot(m, ts);
                        const mine = isMySlot(slot);
                        const booked = slot?.status === 'BOOKED' || slot?.status === 'IN_USE';
                        const available = slot?.status === 'AVAILABLE';
                        const inFlight = actionInFlight === `${m}-${ts}` || actionInFlight === slot?._id;

                        let cellClass = 'p-1.5 border-b border-[hsl(var(--border))] text-center';
                        let content: React.ReactNode = null;

                        if (past) {
                          cellClass += ' bg-[hsl(var(--muted))] opacity-40';
                          content = (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {booked ? 'Done' : '-'}
                            </span>
                          );
                        } else if (mine && slot) {
                          cellClass += ' bg-[hsl(var(--accent))]';
                          content = (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-[hsl(var(--accent-foreground))]">
                                My Booking
                              </span>
                              {slot.status === 'BOOKED' && (
                                <button
                                  onClick={() => void handleCancel(slot._id)}
                                  disabled={!!inFlight}
                                  className="block mx-auto px-2 py-0.5 rounded text-xs font-medium bg-[hsl(var(--destructive))] text-white hover:opacity-90 disabled:opacity-50"
                                >
                                  {inFlight ? '...' : 'Cancel'}
                                </button>
                              )}
                            </div>
                          );
                        } else if (booked) {
                          cellClass += ' bg-[hsl(var(--muted))]';
                          content = (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">Booked</span>
                          );
                        } else if (available) {
                          cellClass += ' bg-[hsl(var(--card))] cursor-pointer hover:bg-[hsl(var(--accent))]/20';
                          content = (
                            <button
                              onClick={() => void handleBook(m, ts)}
                              disabled={!!actionInFlight}
                              className="w-full h-full text-xs font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--accent-foreground))] disabled:opacity-50"
                            >
                              {inFlight ? '...' : 'Book'}
                            </button>
                          );
                        } else {
                          cellClass += ' bg-[hsl(var(--muted))] opacity-60';
                          content = (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {slot?.status ?? '-'}
                            </span>
                          );
                        }

                        return (
                          <td key={m} className={cellClass}>
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* My Bookings */}
          <section>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">My Upcoming Bookings</h3>
            {myBookings.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No active bookings.</p>
            ) : (
              <div className="space-y-2">
                {myBookings.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        Machine {b.machineNumber} &middot; {b.timeSlot}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatDate(b.date)} &middot; {b.status}
                      </p>
                    </div>
                    {b.status === 'BOOKED' && (
                      <button
                        onClick={() => void handleCancel(b._id)}
                        disabled={actionInFlight === b._id}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-[hsl(var(--destructive))] text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {actionInFlight === b._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
