import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { Calendar, Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface LeaveQuota {
  totalAllowed: number;
  used: number;
  remaining: number;
  pending: number;
  history: { month: string; count: number }[];
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function LeaveTrackerPage() {
  usePageTitle('Leave Tracker');
  const [data, setData] = useState<LeaveQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<LeaveQuota>('/leaves/quota')
      .then(res => setData(res.data))
      .catch(err => showError(err, 'Failed to load leave quota'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <PageSkeleton />;

  const usagePercent = data.totalAllowed > 0 ? (data.used / data.totalAllowed) * 100 : 0;
  const isLow = data.remaining <= 3;

  const cards = [
    { label: 'Total Allowed', value: data.totalAllowed, icon: Calendar, iconClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Used', value: data.used, icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'Remaining', value: data.remaining, icon: isLow ? AlertTriangle : Clock, iconClass: isLow ? 'text-rose-600 dark:text-rose-400' : 'text-violet-600 dark:text-violet-400', bgClass: isLow ? 'bg-rose-100 dark:bg-rose-950/40' : 'bg-violet-100 dark:bg-violet-950/40' },
    { label: 'Pending', value: data.pending, icon: TrendingUp, iconClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-950/40' },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Leave Tracker" description="Track your leave quota and attendance" />
      </Reveal>

      <StaggerContainer className="grid grid-cols-2 gap-3" stagger={0.08}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label}>
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="card-glow accent-line relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                    <Icon size={14} className={card.iconClass} />
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
                </div>
                <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums">
                  <AnimatedCounter to={card.value} />
                </p>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Progress Ring */}
      <Reveal delay={0.1}>
        <motion.div
          whileHover={{ y: -2 }}
          transition={spring}
          className="card-glow accent-line p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
        >
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">Leave Usage</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={isLow ? 'hsl(var(--destructive))' : 'hsl(var(--accent))'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - usagePercent / 100) }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">{Math.round(usagePercent)}%</span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">used</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Used leaves</span>
                <span className="font-semibold text-[hsl(var(--foreground))] tabular-nums">{data.used} / {data.totalAllowed}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isLow ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--accent))]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              {isLow && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-xs text-[hsl(var(--destructive))] font-medium"
                >
                  <AlertTriangle size={12} />
                  Low leave balance! Only {data.remaining} remaining.
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </Reveal>

      {/* Monthly History */}
      {data.history.length > 0 && (
        <Reveal delay={0.15}>
          <div className="card-glow accent-line p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Monthly Breakdown</h3>
            <div className="space-y-2">
              {data.history.map((month, i) => (
                <motion.div
                  key={month.month}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0"
                >
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{month.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[hsl(var(--accent))]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((month.count / 5) * 100, 100)}%` }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] tabular-nums w-4 text-right">{month.count}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
