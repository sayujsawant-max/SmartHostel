import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface ResolvedTask {
  _id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  studentId?: { _id: string; name: string; block?: string; roomNumber?: string };
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<ResolvedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ complaints: ResolvedTask[] }>('/complaints/my-history')
      .then((res) => setTasks(res.data.complaints))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader title="Completed Tasks" description="Your resolved maintenance history." />
      </Reveal>

      {loading ? (
        <PageSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState variant="compact" title="No completed tasks yet" description="Resolved tasks will appear here." />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t._id}
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {t.category.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {t.studentId?.name ?? 'Unknown'}
                    {t.studentId?.block && ` · Block ${t.studentId.block}`}
                    {t.studentId?.roomNumber && ` · Room ${t.studentId.roomNumber}`}
                  </p>
                </div>
                <StatusBadge variant="success">
                  {t.status.replace(/_/g, ' ')}
                </StatusBadge>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{t.description}</p>

              {t.resolutionNotes && (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/40">
                  <p className="text-xs font-medium text-green-800 dark:text-green-400">Resolution</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{t.resolutionNotes}</p>
                </div>
              )}

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Resolved {new Date(t.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
