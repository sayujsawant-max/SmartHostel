import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { TrendingUp, TrendingDown, Users, Bed, Clock, Star, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { usePageTitle } from '@hooks/usePageTitle';

interface KpiData {
  occupancy: { totalBeds: number; occupiedBeds: number; availableBeds: number; occupancyRate: number; byBlock: { block: string; total: number; occupied: number }[] };
  fees: { totalCollected: number; totalPending: number; collectionRate: number };
  complaints: { open: number; assigned: number; inProgress: number; resolved: number; avgResolutionHours: number };
  leaves: { pending: number; approved: number; rejected: number };
  students: { total: number; active: number };
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function KpiDashboardPage() {
  usePageTitle('Kpi Dashboard');
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<KpiData>('/admin/analytics')
      .then(res => setData(res.data))
      .catch(err => showError(err, 'Failed to load KPI data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <PageSkeleton />;

  const kpiCards = [
    { label: 'Occupancy Rate', value: Math.round(data.occupancy.occupancyRate), suffix: '%', icon: Bed, iconClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-950/40', trend: data.occupancy.occupancyRate > 80 ? 'up' : 'down' },
    { label: 'Fee Collection', value: Math.round(data.fees.collectionRate), suffix: '%', icon: TrendingUp, iconClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40', trend: data.fees.collectionRate > 70 ? 'up' : 'down' },
    { label: 'Open Complaints', value: data.complaints.open + data.complaints.assigned + data.complaints.inProgress, icon: AlertTriangle, iconClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-950/40', trend: 'neutral' },
    { label: 'Avg Resolution', value: Math.round(data.complaints.avgResolutionHours || 0), suffix: 'h', icon: Clock, iconClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-100 dark:bg-violet-950/40', trend: (data.complaints.avgResolutionHours || 0) < 48 ? 'up' : 'down' },
    { label: 'Active Students', value: data.students?.active ?? data.students?.total ?? 0, icon: Users, iconClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-100 dark:bg-cyan-950/40', trend: 'up' },
    { label: 'Resolved', value: data.complaints.resolved, icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40', trend: 'up' },
  ];

  const blockOccupancy = data.occupancy.byBlock.map(b => ({
    name: b.block,
    occupied: b.occupied,
    available: b.total - b.occupied,
    rate: b.total > 0 ? Math.round((b.occupied / b.total) * 100) : 0,
  }));

  const complaintBreakdown = [
    { name: 'Open', value: data.complaints.open, fill: 'hsl(var(--destructive))' },
    { name: 'Assigned', value: data.complaints.assigned, fill: 'hsl(38, 92%, 50%)' },
    { name: 'In Progress', value: data.complaints.inProgress, fill: 'hsl(var(--accent))' },
    { name: 'Resolved', value: data.complaints.resolved, fill: 'hsl(142, 71%, 45%)' },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="KPI Dashboard" description="Key performance indicators and hostel metrics at a glance" />
      </Reveal>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-3" stagger={0.06}>
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label}>
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                    <Icon size={14} className={card.iconClass} />
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums">
                    <AnimatedCounter to={card.value} />
                    {card.suffix && <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">{card.suffix}</span>}
                  </p>
                  {card.trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                  {card.trend === 'down' && <TrendingDown size={14} className="text-rose-500" />}
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Block Occupancy Chart */}
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ y: -2 }}
            transition={spring}
            className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <BarChart3 size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Block Occupancy</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Beds occupied per block</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={blockOccupancy} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="occupied" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="available" fill="hsl(var(--muted))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </Reveal>

        {/* Complaint Status Breakdown */}
        <Reveal delay={0.15}>
          <motion.div
            whileHover={{ y: -2 }}
            transition={spring}
            className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <Star size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Complaint Status</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Current breakdown by status</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={complaintBreakdown} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {complaintBreakdown.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </Reveal>
      </div>

      {/* Fee Summary Bar */}
      <Reveal delay={0.2}>
        <motion.div
          whileHover={{ y: -2 }}
          transition={spring}
          className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Fee Collection Progress</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">₹{data.fees.totalCollected.toLocaleString('en-IN')} collected of ₹{(data.fees.totalCollected + data.fees.totalPending).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <span className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">{data.fees.collectionRate.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${data.fees.collectionRate}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </motion.div>
      </Reveal>
    </div>
  );
}
