import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from '@components/ui/motion';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  TrendingUp,
  Users,
  CalendarDays,
  ArrowDown,
  ArrowUp,
  Sparkles,
} from 'lucide-react';

interface TimelinePoint {
  date: string;
  present?: number;
  forecast?: number;
  approvedAbsent: number;
}

interface TimelineSummary {
  totalStudents: number;
  todayPresent: number;
  nextWeekAvgForecast: number;
  nextMonthLow: { date: string; forecast: number } | null;
  nextMonthHigh: { date: string; forecast: number } | null;
  approvedFutureLeaves: number;
}

interface TimelineResult {
  series: TimelinePoint[];
  summary: TimelineSummary;
  meta: { lookbackDays: number; forecastDays: number; today: string };
}

const RANGES = [
  { label: '2w forecast', forecast: 14, lookback: 30 },
  { label: '4w forecast', forecast: 30, lookback: 60 },
  { label: '8w forecast', forecast: 56, lookback: 90 },
] as const;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function OccupancyForecastPage() {
  usePageTitle('Occupancy Forecast');
  const [data, setData] = useState<TimelineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeIdx, setRangeIdx] = useState(1); // default 4w

  useEffect(() => {
    setLoading(true);
    const r = RANGES[rangeIdx];
    apiFetch<TimelineResult>(
      `/admin/occupancy/timeline?lookbackDays=${r.lookback}&forecastDays=${r.forecast}`,
    )
      .then((res) => setData(res.data))
      .catch((err) => showError(err, 'Failed to load forecast'))
      .finally(() => setLoading(false));
  }, [rangeIdx]);

  // Recharts can plot two y-fields per row but rendering "historical" and
  // "forecast" as separate lines needs both fields present (with `null` for
  // gaps) so each line is continuous on its half of the chart.
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.series.map((p) => ({
      date: p.date,
      label: formatShortDate(p.date),
      historical: p.present ?? null,
      forecast: p.forecast ?? null,
      absent: p.approvedAbsent,
    }));
  }, [data]);

  if (loading || !data) return <PageSkeleton />;

  const { summary, meta } = data;
  const occupancyPct =
    summary.totalStudents > 0
      ? Math.round((summary.todayPresent / summary.totalStudents) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Occupancy Forecast"
        description="How many students are physically in the hostel — today, the past few weeks, and the next few weeks."
        icon={<TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Today present',
            value: summary.todayPresent,
            sub: `${occupancyPct}% of ${summary.totalStudents}`,
            icon: Users,
            iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Next-week average',
            value: summary.nextWeekAvgForecast,
            sub: 'Predicted',
            icon: Sparkles,
            iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            label: 'Forecast low',
            value: summary.nextMonthLow?.forecast ?? summary.todayPresent,
            sub: summary.nextMonthLow ? formatShortDate(summary.nextMonthLow.date) : '—',
            icon: ArrowDown,
            iconBg: 'bg-rose-100 dark:bg-rose-950/40',
            iconColor: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Forecast high',
            value: summary.nextMonthHigh?.forecast ?? summary.todayPresent,
            sub: summary.nextMonthHigh ? formatShortDate(summary.nextMonthHigh.date) : '—',
            icon: ArrowUp,
            iconBg: 'bg-amber-100 dark:bg-amber-950/40',
            iconColor: 'text-amber-600 dark:text-amber-400',
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{s.label}</p>
                  <p className="text-2xl font-bold tabular-nums">
                    <AnimatedCounter to={s.value} />
                  </p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Range pills */}
      <div className="flex gap-2 flex-wrap">
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setRangeIdx(i)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              rangeIdx === i
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Reveal>
        <div
          data-testid="forecast-chart"
          className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold">
              Daily occupancy — {meta.lookbackDays}d history + {meta.forecastDays}d forecast
            </h3>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, summary.totalStudents]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine
                  x={formatShortDate(meta.today)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ value: 'today', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Area
                  type="monotone"
                  name="Historical present"
                  dataKey="historical"
                  stroke="hsl(var(--accent))"
                  fill="url(#histFill)"
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  name="Forecast present"
                  dataKey="forecast"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-3">
            Forecast = total students − max(approved future leaves on that date, day-of-week
            average absences from history). {summary.approvedFutureLeaves} approved future leave
            {summary.approvedFutureLeaves === 1 ? '' : 's'} contribute to the dashed line.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
