import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

interface ComplaintData {
  byStatus: Record<string, number>;
}

const STATUS_DOTS: { key: string; label: string; color: string }[] = [
  { key: 'OPEN', label: 'Open', color: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'RESOLVED', label: 'Resolved', color: 'bg-emerald-500' },
];

export default function ComplaintStatusWidget() {
  const [data, setData] = useState<ComplaintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<ComplaintData>('/admin/complaint-analytics/categories')
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
            <div className="h-4 w-20 rounded bg-[hsl(var(--muted))] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load complaint data</p>;
  }

  return (
    <div className="space-y-2.5">
      {STATUS_DOTS.map(({ key, label, color }) => (
        <div key={key} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-sm text-[hsl(var(--foreground))]">{label}</span>
          </div>
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
            <AnimatedCounter to={data.byStatus[key] ?? 0} />
          </span>
        </div>
      ))}
    </div>
  );
}
