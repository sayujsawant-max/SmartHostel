import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { Shield, Clock, TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { usePageTitle } from '@hooks/usePageTitle';

interface GateStats {
  totalScans: number;
  allowCount: number;
  denyCount: number;
  avgLatencyMs: number;
  hourlyDistribution: { hour: number; entry: number; exit: number }[];
  recentDenials: { studentName: string; reason: string; time: string }[];
  peakHour: number;
  offlineScans: number;
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function GateAnalyticsPage() {
  usePageTitle('Gate Analytics');
  const [stats, setStats] = useState<GateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<GateStats>('/gate/analytics')
      .then(res => setStats(res.data))
      .catch(err => showError(err, 'Failed to load gate analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <PageSkeleton />;

  const allowRate = stats.totalScans > 0 ? ((stats.allowCount / stats.totalScans) * 100).toFixed(1) : '0';

  const cards = [
    { label: 'Total Scans', value: stats.totalScans, icon: Shield, iconClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Allowed', value: stats.allowCount, icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'Denied', value: stats.denyCount, icon: AlertTriangle, iconClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-100 dark:bg-rose-950/40' },
    { label: 'Avg Latency', value: Math.round(stats.avgLatencyMs), suffix: 'ms', icon: Clock, iconClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-100 dark:bg-violet-950/40' },
  ];

  const hourlyData = stats.hourlyDistribution.map(h => ({
    hour: `${h.hour.toString().padStart(2, '0')}:00`,
    entry: h.entry,
    exit: h.exit,
    total: h.entry + h.exit,
  }));

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Gate Analytics" description="Entry/exit patterns and scan performance metrics" />
      </Reveal>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3" stagger={0.06}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}><Icon size={14} className={card.iconClass} /></div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
                </div>
                <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums">
                  <AnimatedCounter to={card.value} />
                  {card.suffix && <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))] ml-0.5">{card.suffix}</span>}
                </p>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Hourly Traffic Chart */}
      <Reveal delay={0.1}>
        <motion.div whileHover={{ y: -2 }} transition={spring} className="card-glow accent-line p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Hourly Traffic</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Peak hour: {stats.peakHour.toString().padStart(2, '0')}:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-500" /> Entry</span>
              <span className="flex items-center gap-1"><ArrowDownRight size={12} className="text-amber-500" /> Exit</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="entry" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="exit" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </Reveal>

      {/* Allow Rate + Recent Denials */}
      <div className="grid md:grid-cols-2 gap-4">
        <Reveal delay={0.15}>
          <motion.div whileHover={{ y: -2 }} transition={spring} className="card-glow accent-line p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Allow Rate</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - +allowRate / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">{allowRate}%</span>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-[hsl(var(--muted-foreground))]">Offline scans: <span className="font-semibold text-[hsl(var(--foreground))]">{stats.offlineScans}</span></p>
                <p className="text-[hsl(var(--muted-foreground))]">Deny rate: <span className="font-semibold text-[hsl(var(--foreground))]">{(100 - +allowRate).toFixed(1)}%</span></p>
              </div>
            </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.2}>
          <motion.div whileHover={{ y: -2 }} transition={spring} className="card-glow accent-line p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Recent Denials</h3>
            {stats.recentDenials.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No recent denials</p>
            ) : (
              <div className="space-y-2">
                {stats.recentDenials.slice(0, 5).map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <div>
                      <p className="text-xs font-medium text-[hsl(var(--foreground))]">{d.studentName}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{d.reason}</p>
                    </div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">{new Date(d.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </Reveal>
      </div>
    </div>
  );
}
