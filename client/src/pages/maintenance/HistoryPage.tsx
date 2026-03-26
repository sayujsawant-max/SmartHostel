import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion } from 'motion/react';
import { Reveal } from '@/components/motion';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import {
  CheckCircle2,
  Wrench,
  Building2,
  User,
  Clock,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { usePageTitle } from '@hooks/usePageTitle';

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

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

export default function HistoryPage() {
  usePageTitle('History');
  const [tasks, setTasks] = useState<ResolvedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/complaints/my-history')
      .then((res) => {
        const data = res.data as Record<string, unknown>;
        const list = Array.isArray(data) ? data : Array.isArray(data?.complaints) ? data.complaints : [];
        setTasks(list as ResolvedTask[]);
      })
      .catch((err: unknown) => showError(err, 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader title={<span className="gradient-heading">Completed Tasks</span>} description="Your resolved maintenance history." />
      </motion.div>

      {/* Stat */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 w-fit card-shine"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
            <AnimatedCounter to={tasks.length} duration={0.8} />
          </p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Tasks Completed</p>
        </div>
      </motion.div>

      {loading ? (
        <PageSkeleton />
      ) : tasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState variant="compact" title="No completed tasks yet" description="Resolved tasks will appear here." />
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
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3 transition-shadow hover:shadow-md card-glow card-shine magnetic-hover"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
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
                  <StatusBadge variant="success">
                    {t.status.replace(/_/g, ' ')}
                  </StatusBadge>
                </div>

                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{t.description}</p>

                {t.resolutionNotes && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolution
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{t.resolutionNotes}</p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <Clock className="w-3 h-3" />
                  Resolved {new Date(t.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
