import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

interface TaskSummary {
  open: number;
  inProgress: number;
  completed: number;
  priorities: Record<string, number>;
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

export default function MaintenanceTasksWidget() {
  const [data, setData] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TaskSummary>('/admin/maintenance/summary')
      .then((res) => setData(res.data))
      .catch(() => {
        // Fallback mock data
        setData({
          open: 12,
          inProgress: 5,
          completed: 48,
          priorities: { HIGH: 3, MEDIUM: 8, LOW: 6 },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-24 rounded bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load tasks</p>;
  }

  return (
    <div className="space-y-3">
      {/* Status counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            <AnimatedCounter to={data.open} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Open</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
            <AnimatedCounter to={data.inProgress} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">In Progress</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter to={data.completed} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Completed</p>
        </div>
      </div>
      {/* Priority breakdown */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">By Priority</p>
        {Object.entries(data.priorities).map(([priority, count]) => (
          <div key={priority} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[priority] ?? 'bg-gray-400'}`} />
              <span className="text-xs text-[hsl(var(--foreground))]">{priority}</span>
            </div>
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
