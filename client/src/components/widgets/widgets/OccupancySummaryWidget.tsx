import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

interface OccupancyData {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
}

export default function OccupancySummaryWidget() {
  const [data, setData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<OccupancyData>('/admin/occupancy/overview')
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-[hsl(var(--muted))] animate-pulse" />
        <div className="h-8 w-32 rounded bg-[hsl(var(--muted))] animate-pulse" />
        <div className="h-3 w-full rounded-full bg-[hsl(var(--muted))] animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load occupancy data</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-xl font-bold text-[hsl(var(--foreground))]">
            <AnimatedCounter to={data.totalBeds} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Rooms</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter to={data.occupancyRate} suffix="%" />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Occupied</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            <AnimatedCounter to={data.availableBeds} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Vacant</p>
        </div>
      </div>
      {/* Occupancy bar */}
      <div className="h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${data.occupancyRate}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
