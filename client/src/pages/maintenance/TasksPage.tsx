import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { AnimatePresence, motion } from 'motion/react';
import { Reveal } from '@/components/motion';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import {
  Wrench,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { usePageTitle } from '@hooks/usePageTitle';

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

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'success',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

function SLABadge({ dueAt }: { dueAt: string }) {
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffH = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdue = Math.abs(diffH);
    return (
      <motion.span
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full breathe-glow"
      >
        Overdue {overdue}h
      </motion.span>
    );
  }
  if (diffH <= 2) {
    return <span className="text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full">Due in {diffH}h</span>;
  }
  return <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">Due in {diffH}h</span>;
}

export default function TasksPage() {
  usePageTitle('Tasks');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiFetch('/complaints/my-tasks');
      const data = res.data as Record<string, unknown>;
      const list = Array.isArray(data) ? data : Array.isArray(data?.complaints) ? data.complaints : [];
      setTasks(list as TaskItem[]);
    } catch (err) {
      showError(err, 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleStartWork = async (id: string) => {
    setActionId(id);
    try {
      await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      showSuccess('Work started');
      void fetchTasks();
    } catch (err) {
      showError(err);
    } finally {
      setActionId(null);
    }
  };

  const handleResolve = async (id: string) => {
    if (!resolutionNotes.trim()) return;
    setActionId(id);
    try {
      await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: resolutionNotes.trim() }),
      });
      showSuccess('Task resolved');
      setResolvingId(null);
      setResolutionNotes('');
      void fetchTasks();
    } catch (err) {
      showError(err);
    } finally {
      setActionId(null);
    }
  };

  const assignedCount = tasks.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const criticalCount = tasks.filter((t) => t.priority === 'CRITICAL').length;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader title={<span className="gradient-heading">My Tasks</span>} description="Assigned complaints sorted by urgency." />
      </motion.div>

      {/* Stats */}
      <Reveal>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Assigned', value: assignedCount, icon: Clock, bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/40', cardBg: 'bg-blue-50/50 dark:bg-blue-950/20' },
          { label: 'In Progress', value: inProgressCount, icon: Wrench, bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40', cardBg: 'bg-amber-50/50 dark:bg-amber-950/20' },
          { label: 'Critical', value: criticalCount, icon: AlertTriangle, bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40', cardBg: 'bg-rose-50/50 dark:bg-rose-950/20' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border card-shine ${stat.border} ${stat.cardBg}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg} ${stat.text}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className={`text-xl font-bold ${stat.text} leading-tight`}>
                <AnimatedCounter to={stat.value} duration={0.8} />
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
      </Reveal>

      {loading ? (
        <PageSkeleton />
      ) : tasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState variant="compact" title="No tasks assigned" description="You're all caught up!" />
        </motion.div>
      ) : (
        <Reveal>
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.012 }}
                transition={spring}
                className={`p-4 rounded-2xl border space-y-3 transition-shadow hover:shadow-md card-shine magnetic-hover ${
                  t.priority === 'CRITICAL'
                    ? 'border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] card-glow'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      t.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                    }`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        {t.category.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                        <User className="w-3 h-3" />
                        <span>{t.studentId?.name ?? 'Unknown'}</span>
                        {t.studentId?.block && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Block {t.studentId.block}
                          </span>
                        )}
                        {t.studentId?.roomNumber && <span>· Room {t.studentId.roomNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <SLABadge dueAt={t.dueAt} />
                    <StatusBadge variant={PRIORITY_VARIANT[t.priority] ?? 'neutral'}>
                      {t.priority}
                    </StatusBadge>
                  </div>
                </div>

                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{t.description}</p>

                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Clock className="w-3 h-3" />
                  <span>{t.status.replace(/_/g, ' ')}</span>
                  <span>·</span>
                  <span>{new Date(t.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {t.status === 'ASSIGNED' && (
                    <motion.button
                      onClick={() => void handleStartWork(t._id)}
                      disabled={actionId === t._id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {actionId === t._id ? 'Starting...' : 'Start Work'}
                    </motion.button>
                  )}

                  {t.status === 'IN_PROGRESS' && resolvingId !== t._id && (
                    <motion.button
                      onClick={() => setResolvingId(t._id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Resolved
                    </motion.button>
                  )}

                  <AnimatePresence>
                    {t.status === 'IN_PROGRESS' && resolvingId === t._id && (
                      <motion.div
                        key="resolve-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                        className="flex-1"
                      >
                        <div className="space-y-2">
                          <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="Describe what was done to resolve..."
                            rows={2}
                            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => void handleResolve(t._id)}
                              disabled={!resolutionNotes.trim() || actionId === t._id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              transition={spring}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {actionId === t._id ? 'Saving...' : 'Confirm Resolved'}
                            </motion.button>
                            <button
                              onClick={() => { setResolvingId(null); setResolutionNotes(''); }}
                              className="px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        </Reveal>
      )}
    </div>
  );
}
