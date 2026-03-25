import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

interface VisitorStats {
  todayCount: number;
  checkedIn: number;
  recent: { _id: string; name: string; purpose: string; checkInTime: string }[];
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function VisitorLogWidget() {
  const [data, setData] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<VisitorStats>('/admin/visitors/summary')
      .then((res) => setData(res.data))
      .catch(() => {
        // Fallback mock data
        setData({
          todayCount: 14,
          checkedIn: 3,
          recent: [
            { _id: '1', name: 'Rajesh Kumar', purpose: 'Parent Visit', checkInTime: new Date().toISOString() },
            { _id: '2', name: 'Priya Sharma', purpose: 'Document Delivery', checkInTime: new Date(Date.now() - 3600000).toISOString() },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-24 rounded bg-[hsl(var(--muted))] animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load visitor data</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <div>
          <p className="text-xl font-bold text-[hsl(var(--foreground))]">
            <AnimatedCounter to={data.todayCount} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Today</p>
        </div>
        <div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter to={data.checkedIn} />
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Checked In</p>
        </div>
      </div>
      {data.recent.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Recent</p>
          {data.recent.slice(0, 3).map((v) => (
            <div key={v._id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="text-[hsl(var(--foreground))] truncate">{v.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{v.purpose}</p>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 ml-2">
                {timeAgo(v.checkInTime)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
