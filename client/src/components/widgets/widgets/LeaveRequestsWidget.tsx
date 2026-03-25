import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { ArrowRight } from 'lucide-react';

interface LeaveRequest {
  _id: string;
  studentId: { name: string };
  startDate: string;
  endDate: string;
  status: string;
}

export default function LeaveRequestsWidget() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<LeaveRequest[]>('/admin/leaves?status=PENDING&limit=5')
      .then((res) => setLeaves(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-16 rounded bg-[hsl(var(--muted))] animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load leave requests</p>;
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
          <AnimatedCounter to={leaves.length} />
        </span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">pending</span>
      </div>
      {leaves.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No pending leave requests</p>
      ) : (
        <div className="space-y-2">
          {leaves.map((l) => (
            <div key={l._id} className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--foreground))] truncate mr-2">
                {l.studentId?.name ?? 'Unknown'}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">
                {fmt(l.startDate)} - {fmt(l.endDate)}
              </span>
            </div>
          ))}
        </div>
      )}
      <Link
        to="/warden/students"
        className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--primary))] hover:underline"
      >
        View all <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
