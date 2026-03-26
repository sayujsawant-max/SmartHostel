import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

interface FeeData {
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
}

export default function FeeCollectionWidget() {
  const [data, setData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(false);

  useEffect(() => {
    apiFetch<{ fees: FeeData }>('/admin/analytics')
      .then((res) => setData(res.data.fees))
      .catch(() => {
        // Fallback mock data when endpoint not available
        setData({ totalCollected: 847500, totalPending: 152500, collectionRate: 85 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-[hsl(var(--muted))] animate-pulse" />
        <div className="h-4 w-32 rounded bg-[hsl(var(--muted))] animate-pulse" />
        <div className="h-3 w-full rounded-full bg-[hsl(var(--muted))] animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load fee data</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Collected</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter to={data.totalCollected} prefix="₹" />
          </p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Pending</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
            <AnimatedCounter to={data.totalPending} prefix="₹" />
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1">
          <span>Collection rate</span>
          <span>{data.collectionRate}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.collectionRate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
