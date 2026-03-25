import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { AlertTriangle } from 'lucide-react';

interface AtRiskStudent {
  _id: string;
  name: string;
  riskScore: number;
  reason: string;
}

interface WellnessData {
  atRiskCount: number;
  students: AtRiskStudent[];
}

export default function WellnessAlertsWidget() {
  const [data, setData] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<WellnessData>('/admin/wellness/at-risk')
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-16 rounded bg-[hsl(var(--muted))] animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load wellness data</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {data.atRiskCount > 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </motion.div>
        )}
        <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
          <AnimatedCounter to={data.atRiskCount} />
        </span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">at-risk students</span>
      </div>
      {data.students.length > 0 ? (
        <div className="space-y-2">
          {data.students.slice(0, 3).map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 truncate">{s.name}</p>
                <p className="text-xs text-red-600 dark:text-red-400">{s.reason}</p>
              </div>
              <span className="text-xs font-semibold text-red-700 dark:text-red-300 shrink-0 ml-2">
                {s.riskScore}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">No at-risk students detected</p>
      )}
    </div>
  );
}
