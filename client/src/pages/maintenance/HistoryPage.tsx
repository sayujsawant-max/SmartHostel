import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Completed Tasks</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Your resolved maintenance history.</p>
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">No completed tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t._id} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2">
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
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t.status}
                </span>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{t.description}</p>

              {t.resolutionNotes && (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs font-medium text-green-800">Resolution</p>
                  <p className="text-sm text-green-700">{t.resolutionNotes}</p>
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
