import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { ArrowRight } from 'lucide-react';

interface Notice {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function RecentNoticesWidget() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<Notice[]>('/notices?limit=3')
      .then((res) => setNotices(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-3/4 rounded bg-[hsl(var(--muted))] animate-pulse" />
            <div className="h-3 w-full rounded bg-[hsl(var(--muted))] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Unable to load notices</p>;
  }

  if (notices.length === 0) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">No notices posted yet</p>;
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <div key={notice._id} className="space-y-0.5">
          <p className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-1">
            {notice.title}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">
            {notice.content}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {new Date(notice.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      ))}
      <Link
        to="/warden/notices"
        className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--primary))] hover:underline"
      >
        View all notices <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
