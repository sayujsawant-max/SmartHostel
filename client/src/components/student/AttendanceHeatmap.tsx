import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '@services/api';
import { CalendarDays, TrendingUp, Activity, Zap } from 'lucide-react';

interface GateScan {
  _id: string;
  createdAt: string;
  verdict: string;
}

function getDaysInRange(weeks: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7) + 1);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getIntensity(count: number): string {
  if (count === 0) return 'bg-[hsl(var(--muted))]/30';
  if (count === 1) return 'bg-emerald-300/80 dark:bg-emerald-700/80';
  if (count === 2) return 'bg-emerald-400 dark:bg-emerald-600';
  if (count <= 4) return 'bg-emerald-500 dark:bg-emerald-500';
  return 'bg-emerald-600 dark:bg-emerald-400';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function AttendanceHeatmap() {
  const [scans, setScans] = useState<GateScan[]>([]);
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; count: number; x: number; y: number } | null>(null);
  const weeks = 12;

  useEffect(() => {
    apiFetch<{ scans: GateScan[] }>('/gate/my-scans')
      .then((res) => {
        const data = res.data;
        setScans(Array.isArray(data) ? data : data?.scans ?? []);
      })
      .catch(() => setScans([]));
  }, []);

  const days = useMemo(() => getDaysInRange(weeks), [weeks]);

  const scanMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const scan of scans) {
      const key = new Date(scan.createdAt).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [scans]);

  const grid = useMemo(() => {
    const cols: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, i) => {
      const month = week[0].getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], col: i });
        lastMonth = month;
      }
    });
    return labels;
  }, [grid]);

  const totalScans = scans.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = scanMap.get(today) ?? 0;

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if ((scanMap.get(key) ?? 0) > 0) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  }, [scanMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 card-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Gate Activity</h3>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Last {weeks} weeks</p>
          </div>
        </div>

        {/* Stats pills — plain spans, no motion */}
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
              <Zap className="w-3 h-3" />
              {streak}d streak
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
            <TrendingUp className="w-3 h-3" />
            {totalScans} scans
          </span>
          {todayCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
              <Activity className="w-3 h-3" />
              {todayCount} today
            </span>
          )}
        </div>
      </div>

      {/* Heatmap Grid — plain divs with CSS hover */}
      <div className="relative overflow-x-auto pb-1">
        {/* Month labels */}
        <div className="flex ml-8 mb-1.5">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium"
              style={{ position: 'relative', left: `${m.col * 16}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1.5 pt-0">
            {DAYS_LABELS.map((label, i) => (
              <span key={i} className="text-[9px] text-[hsl(var(--muted-foreground))] h-[13px] flex items-center justify-end w-6">
                {label}
              </span>
            ))}
          </div>

          {/* Grid cells — plain divs, CSS-only hover scale */}
          <div className="flex gap-[3px]">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const key = day.toISOString().slice(0, 10);
                  const count = scanMap.get(key) ?? 0;
                  const isToday = key === today;
                  const isFuture = day > new Date();

                  return (
                    <div
                      key={key}
                      className={`w-[13px] h-[13px] rounded-sm cursor-default transition-transform duration-100 hover:scale-[1.8] hover:z-10 ${
                        isFuture ? 'bg-transparent' : getIntensity(count)
                      } ${isToday ? 'ring-1 ring-[hsl(var(--accent))]/40' : ''}`}
                      onMouseEnter={(e) => {
                        if (!isFuture) {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setHoveredDay({ date: day, count, x: rect.left, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Less</span>
          {[0, 1, 2, 3, 5].map((n) => (
            <div key={n} className={`w-[10px] h-[10px] rounded-sm ${getIntensity(n)}`} />
          ))}
          <span className="text-[9px] text-[hsl(var(--muted-foreground))]">More</span>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 px-3 py-2 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] font-medium shadow-xl pointer-events-none"
            style={{ left: hoveredDay.x - 35, top: hoveredDay.y - 42 }}
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-sm ${getIntensity(hoveredDay.count)}`} />
              <span>
                {hoveredDay.count} scan{hoveredDay.count !== 1 ? 's' : ''} on{' '}
                {hoveredDay.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
              </span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[hsl(var(--foreground))]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
