import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import StatusBadge from '@components/ui/StatusBadge';
import { PageSkeleton } from '@components/Skeleton';

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Reveal><PageHeader title="Laundry Management" description="Today's laundry slot overview and machine utilization." /></Reveal>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader title="Laundry Management" description="Today's laundry slot overview and machine utilization." />
      </Reveal>

      {error && <ErrorBanner message={error} />}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow text-center">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><AnimatedCounter to={totalSlots} /></p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Slots</p>
        </div>
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow text-center">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><AnimatedCounter to={availableSlots} /></p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Available</p>
        </div>
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow text-center">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><AnimatedCounter to={bookedSlots} /></p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Booked</p>
        </div>
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow text-center">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><AnimatedCounter to={inUseSlots} /></p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">In Use</p>
        </div>
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow text-center">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]"><AnimatedCounter to={completedSlots} /></p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Completed</p>
        </div>
      </div>

      {/* Machine Utilization */}
      <Reveal delay={0.1}>
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow">
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
      </Reveal>

      {/* Active Bookings */}
      <Reveal delay={0.15}>
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">
          Active Bookings Today
          {activeBookings.length > 0 && (
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
              {activeBookings.length}
            </span>
          )}
        </h3>

        {activeBookings.length === 0 ? (
          <EmptyState variant="compact" title="No active bookings" description="No active bookings for today." />
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
                <StatusBadge variant={slot.status === 'IN_USE' ? 'success' : 'info'}>
                  {slot.status === 'IN_USE' ? 'In Use' : 'Booked'}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
      </Reveal>
    </div>
  );
}
