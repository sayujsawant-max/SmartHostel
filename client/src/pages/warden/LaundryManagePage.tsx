import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { FadeIn, CountUp } from '@components/ui/motion';

interface SlotData {
  _id: string;
  machineNumber: number;
  date: string;
  timeSlot: string;
  bookedBy: { _id: string; name: string; email: string } | null;
  status: 'AVAILABLE' | 'BOOKED' | 'IN_USE' | 'COMPLETED' | 'CANCELLED';
}

const MACHINES = [1, 2, 3, 4, 5];

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function LaundryManagePage() {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = toDateString(new Date());

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<SlotData[]>(`/laundry?date=${today}`);
      setSlots(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void fetchSlots();
    const interval = setInterval(() => void fetchSlots(), 60_000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  // Compute stats
  const totalSlots = slots.length;
  const bookedSlots = slots.filter((s) => s.status === 'BOOKED').length;
  const inUseSlots = slots.filter((s) => s.status === 'IN_USE').length;
  const completedSlots = slots.filter((s) => s.status === 'COMPLETED').length;
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE').length;

  const machineStats = MACHINES.map((m) => {
    const machineSlots = slots.filter((s) => s.machineNumber === m);
    const used = machineSlots.filter((s) => s.status !== 'AVAILABLE').length;
    return {
      machine: m,
      total: machineSlots.length,
      used,
      utilization: machineSlots.length > 0 ? Math.round((used / machineSlots.length) * 100) : 0,
    };
  });

  const activeBookings = slots
    .filter((s) => s.status === 'BOOKED' || s.status === 'IN_USE')
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Laundry Management</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Today's laundry slot overview and machine utilization.
          </p>
        </div>
      </FadeIn>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><CountUp to={totalSlots} /></p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Slots</p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><CountUp to={availableSlots} /></p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Available</p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><CountUp to={bookedSlots} /></p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Booked</p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><CountUp to={inUseSlots} /></p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">In Use</p>
            </div>
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><CountUp to={completedSlots} /></p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Completed</p>
            </div>
          </div>

          {/* Machine Utilization */}
          <FadeIn delay={0.1}>
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">Machine Utilization</h3>
            <div className="space-y-3">
              {machineStats.map((ms) => (
                <div key={ms.machine} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[hsl(var(--foreground))] w-24">
                    Machine {ms.machine}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${ms.utilization}%`,
                        backgroundColor: 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 text-right">
                    {ms.used}/{ms.total} ({ms.utilization}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>

          {/* Active Bookings */}
          <FadeIn delay={0.15}>
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">
              Active Bookings Today
              {activeBookings.length > 0 && (
                <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                  {activeBookings.length}
                </span>
              )}
            </h3>

            {activeBookings.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No active bookings for today.</p>
            ) : (
              <div className="space-y-2">
                {activeBookings.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        Machine {slot.machineNumber} &middot; {slot.timeSlot}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {slot.bookedBy?.name ?? 'Unknown'} ({slot.bookedBy?.email ?? ''})
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        slot.status === 'IN_USE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {slot.status === 'IN_USE' ? 'In Use' : 'Booked'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}
