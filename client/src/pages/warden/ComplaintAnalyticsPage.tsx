import { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@hooks/usePageTitle';
import { motion } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const CATEGORIES = [
  'ELECTRICAL',
  'PLUMBING',
  'FURNITURE',
  'CLEANING',
  'NETWORK',
  'OTHER',
] as const;

type Category = (typeof CATEGORIES)[number];

interface WeekData {
  week: string;
  complaints: number;
}

interface CategoryData {
  category: Category;
  count: number;
  prevCount: number;
}

interface ResolutionBucket {
  label: string;
  count: number;
}

interface BlockHotspot {
  block: string;
  count: number;
}

// Generate mock weekly trend data
function generateWeeklyData(): WeekData[] {
  const data: WeekData[] = [];
  const base = 18;
  for (let i = 11; i >= 0; i--) {
    const weekNum = 12 - i;
    data.push({
      week: `W${weekNum}`,
      complaints: Math.max(
        3,
        Math.round(base + Math.sin(i * 0.7) * 8 + (12 - i) * 0.6 + (Math.random() * 6 - 3)),
      ),
    });
  }
  return data;
}

function generateCategoryData(): CategoryData[] {
  return CATEGORIES.map((cat) => {
    const count = Math.round(8 + Math.random() * 30);
    const prevCount = Math.round(count + (Math.random() * 12 - 6));
    return { category: cat, count, prevCount };
  });
}

function generateResolutionData(): ResolutionBucket[] {
  return [
    { label: '<1 day', count: Math.round(12 + Math.random() * 15) },
    { label: '1-3 days', count: Math.round(20 + Math.random() * 18) },
    { label: '3-7 days', count: Math.round(8 + Math.random() * 12) },
    { label: '>7 days', count: Math.round(3 + Math.random() * 8) },
  ];
}

function generateHotspots(): BlockHotspot[] {
  return ['A', 'B', 'C', 'D', 'E', 'F'].map((block) => ({
    block,
    count: Math.round(4 + Math.random() * 25),
  }));
}

function predictNextWeek(data: WeekData[]): number {
  const last4 = data.slice(-4).map((d) => d.complaints);
  if (last4.length < 2) return last4[last4.length - 1] ?? 0;
  // Simple linear extrapolation
  const n = last4.length;
  const xMean = (n - 1) / 2;
  const yMean = last4.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  last4.forEach((y, i) => {
    num += (i - xMean) * (y - yMean);
    den += (i - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;
  return Math.max(0, Math.round(yMean + slope * (n - xMean)));
}

const categoryColorMap: Record<Category, string> = {
  ELECTRICAL: '#f59e0b',
  PLUMBING: '#3b82f6',
  FURNITURE: '#8b5cf6',
  CLEANING: '#10b981',
  NETWORK: '#ef4444',
  OTHER: '#6b7280',
};

export default function ComplaintAnalyticsPage() {
  usePageTitle('Complaint Analytics');
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [resolutionData, setResolutionData] = useState<ResolutionBucket[]>([]);
  const [hotspots, setHotspots] = useState<BlockHotspot[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiFetch('/admin/analytics');
        const d = res?.data ?? res;
        if (d?.weeklyData) setWeeklyData(d.weeklyData);
        if (d?.categoryData) setCategoryData(d.categoryData);
        if (d?.resolutionData) setResolutionData(d.resolutionData);
        if (d?.hotspots) setHotspots(d.hotspots);
      } catch {
        // API may not exist yet - use mock data
      }

      // Fill in any missing data with mocks
      setWeeklyData((prev) => (prev.length > 0 ? prev : generateWeeklyData()));
      setCategoryData((prev) => (prev.length > 0 ? prev : generateCategoryData()));
      setResolutionData((prev) => (prev.length > 0 ? prev : generateResolutionData()));
      setHotspots((prev) => (prev.length > 0 ? prev : generateHotspots()));
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalComplaints = useMemo(
    () => weeklyData.reduce((s, w) => s + w.complaints, 0),
    [weeklyData],
  );

  const totalResolved = useMemo(
    () => resolutionData.reduce((s, r) => s + r.count, 0),
    [resolutionData],
  );

  const resolutionRate = totalComplaints > 0 ? (totalResolved / totalComplaints) * 100 : 0;

  const avgResolutionTime = useMemo(() => {
    const weights = [0.5, 2, 5, 10];
    const totalW = resolutionData.reduce((s, r, i) => s + r.count * weights[i], 0);
    const totalC = resolutionData.reduce((s, r) => s + r.count, 0);
    return totalC > 0 ? totalW / totalC : 0;
  }, [resolutionData]);

  const predicted = useMemo(() => predictNextWeek(weeklyData), [weeklyData]);

  const maxHotspot = useMemo(
    () => Math.max(...hotspots.map((h) => h.count), 1),
    [hotspots],
  );

  if (loading) return <PageSkeleton />;

  const statCards = [
    {
      label: 'Total Complaints',
      value: totalComplaints,
      icon: MessageSquareWarning,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-950/40',
    },
    {
      label: 'Resolution Rate',
      value: resolutionRate,
      suffix: '%',
      decimals: 1,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    },
    {
      label: 'Avg Resolution Time',
      value: avgResolutionTime,
      suffix: ' days',
      decimals: 1,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/40',
    },
    {
      label: 'Predicted Next Week',
      value: predicted,
      icon: BrainCircuit,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-950/40',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Complaint Analytics"
        subtitle="Predictive insights and complaint trend analysis"
      />

      {/* Summary Stats */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StaggerItem key={card.label}>
            <Reveal>
              <motion.div
                className="card-glow relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                whileHover={{ y: -2 }}
                transition={spring}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/25 to-transparent" />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-xl p-2.5 ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    {card.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  <AnimatedCounter
                    value={card.value}
                    decimals={card.decimals ?? 0}
                  />
                  {card.suffix ?? ''}
                </div>
              </motion.div>
            </Reveal>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Complaint Trend Area Chart */}
      <Reveal>
        <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h3 className="mb-4 text-base font-semibold text-[hsl(var(--foreground))]">
            Complaint Trends (Last 12 Weeks)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="complaintGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="complaints"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#complaintGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Reveal>
          <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h3 className="mb-4 text-base font-semibold text-[hsl(var(--foreground))]">
              Complaints by Category
            </h3>
            <StaggerContainer className="space-y-3">
              {categoryData
                .sort((a, b) => b.count - a.count)
                .map((cat) => {
                  const max = Math.max(...categoryData.map((c) => c.count), 1);
                  const pct = (cat.count / max) * 100;
                  const trending = cat.count >= cat.prevCount;
                  return (
                    <StaggerItem key={cat.category}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                              {cat.category}
                            </span>
                            {trending ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                <TrendingUp className="h-3 w-3" /> Up
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <TrendingDown className="h-3 w-3" /> Down
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                            {cat.count}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[hsl(var(--muted))]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor:
                                categoryColorMap[cat.category],
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={spring}
                          />
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
            </StaggerContainer>
          </div>
        </Reveal>

        {/* Resolution Time Distribution */}
        <Reveal>
          <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h3 className="mb-4 text-base font-semibold text-[hsl(var(--foreground))]">
              Resolution Time Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Prediction Card */}
        <Reveal>
          <motion.div
            className="card-glow relative overflow-hidden rounded-2xl border border-violet-500/40 bg-[hsl(var(--card))] p-6"
            whileHover={{ y: -2 }}
            transition={spring}
          >
            {/* Gradient accent border glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-950/40">
                  <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    AI Prediction
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Based on linear trend extrapolation
                  </p>
                </div>
              </div>

              <div className="mb-3 text-4xl font-bold text-violet-600 dark:text-violet-400">
                <AnimatedCounter value={predicted} />
                <span className="ml-2 text-base font-medium text-[hsl(var(--muted-foreground))]">
                  complaints expected
                </span>
              </div>

              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Estimated complaint volume for next week, calculated from the
                trend of the last 4 data points. Plan staffing and resources
                accordingly.
              </p>

              <div className="mt-4 flex items-center gap-2">
                {weeklyData.length >= 2 &&
                weeklyData[weeklyData.length - 1].complaints >=
                  weeklyData[weeklyData.length - 2].complaints ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    <TrendingUp className="h-3 w-3" /> Rising trend
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <TrendingDown className="h-3 w-3" /> Declining trend
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </Reveal>

        {/* Complaint Hotspot Map */}
        <Reveal>
          <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-orange-100 p-2.5 dark:bg-orange-950/40">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
                  Complaint Hotspots
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Complaint density by block
                </p>
              </div>
            </div>

            <StaggerContainer className="grid grid-cols-3 gap-3">
              {hotspots
                .sort((a, b) => b.count - a.count)
                .map((spot) => {
                  const intensity = spot.count / maxHotspot;
                  return (
                    <StaggerItem key={spot.block}>
                      <motion.div
                        className="relative flex flex-col items-center justify-center rounded-2xl border border-[hsl(var(--border))] p-4"
                        style={{
                          backgroundColor: `rgba(239, 68, 68, ${intensity * 0.2})`,
                          borderColor: `rgba(239, 68, 68, ${intensity * 0.4})`,
                        }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        transition={spring}
                      >
                        <span className="text-lg font-bold text-[hsl(var(--foreground))]">
                          Block {spot.block}
                        </span>
                        <span
                          className="text-2xl font-bold"
                          style={{
                            color: `rgba(239, 68, 68, ${0.5 + intensity * 0.5})`,
                          }}
                        >
                          {spot.count}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          complaints
                        </span>
                      </motion.div>
                    </StaggerItem>
                  );
                })}
            </StaggerContainer>

            {/* Density legend */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Low</span>
              <div className="flex h-2 flex-1 overflow-hidden rounded-full">
                <div className="flex-1 bg-red-500/5" />
                <div className="flex-1 bg-red-500/10" />
                <div className="flex-1 bg-red-500/20" />
                <div className="flex-1 bg-red-500/30" />
                <div className="flex-1 bg-red-500/40" />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">High</span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
