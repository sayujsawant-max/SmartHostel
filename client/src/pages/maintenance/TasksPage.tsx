import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

interface TaskItem {
  _id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  photoUrl: string | null;
  dueAt: string;
  createdAt: string;
  studentId?: { _id: string; name: string; block?: string; roomNumber?: string };
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
};

function SLABadge({ dueAt }: { dueAt: string }) {
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffH = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdue = Math.abs(diffH);
    return <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Overdue {overdue}h</span>;
  }
  if (diffH <= 2) {
    return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Due in {diffH}h</span>;
  }
  return <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">Due in {diffH}h</span>;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiFetch<{ complaints: TaskItem[] }>('/complaints/my-tasks');
      setTasks(res.data.complaints);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleStartWork = async (id: string) => {
    try {
      await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      void fetchTasks();
    } catch {
      // silently fail
    }
  };

  const handleResolve = async (id: string) => {
    if (!resolutionNotes.trim()) return;
    try {
      await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: resolutionNotes.trim() }),
      });
      setResolvingId(null);
      setResolutionNotes('');
      void fetchTasks();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">My Tasks</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Assigned complaints sorted by urgency.</p>
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">No tasks assigned. You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t._id}
              className={`p-4 rounded-xl border space-y-2 ${
                t.priority === 'CRITICAL' ? 'border-red-300 bg-red-50/30' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
              }`}
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
                <div className="flex gap-2 items-center">
                  <SLABadge dueAt={t.dueAt} />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? ''}`}>
                    {t.priority}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{t.description}</p>

              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Status: {t.status.replace(/_/g, ' ')} · {new Date(t.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {t.status === 'ASSIGNED' && (
                  <button
                    onClick={() => void handleStartWork(t._id)}
                    className="px-4 py-1.5 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium"
                  >
                    Start Work
                  </button>
                )}

                {t.status === 'IN_PROGRESS' && resolvingId !== t._id && (
                  <button
                    onClick={() => setResolvingId(t._id)}
                    className="px-4 py-1.5 rounded bg-green-600 text-white text-sm font-medium"
                  >
                    Mark Resolved
                  </button>
                )}

                {t.status === 'IN_PROGRESS' && resolvingId === t._id && (
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Describe what was done to resolve..."
                      rows={2}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleResolve(t._id)}
                        disabled={!resolutionNotes.trim()}
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs font-medium disabled:opacity-50"
                      >
                        Confirm Resolved
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolutionNotes(''); }}
                        className="px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
