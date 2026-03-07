import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';

interface Leave {
  _id: string;
  status: string;
}

export default function ActionsPage() {
  const [hasActivePass, setHasActivePass] = useState(false);

  useEffect(() => {
    apiFetch<{ leaves: Leave[] }>('/leaves')
      .then((res) => {
        const active = res.data.leaves.some((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');
        setHasActivePass(active);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Actions</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Quick actions for your hostel needs.</p>
      </div>

      <div className="grid gap-3">
        <Link
          to="/student/actions/show-qr"
          className={`p-4 rounded-xl border text-center ${
            hasActivePass
              ? 'bg-green-50 border-green-200'
              : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] opacity-60 pointer-events-none'
          }`}
        >
          <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Show QR</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {hasActivePass ? 'Display your active gate pass' : 'No active pass'}
          </p>
        </Link>

        <Link
          to="/student/actions/report-issue"
          className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center"
        >
          <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Report Issue</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            File a maintenance complaint
          </p>
        </Link>

        <Link
          to="/student/actions/request-leave"
          className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center"
        >
          <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Request Leave</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Apply for day outing or overnight leave
          </p>
        </Link>

        <Link
          to="/student/visitors"
          className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center"
        >
          <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Register Visitor</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Pre-register an expected visitor
          </p>
        </Link>

        <Link
          to="/student/room-change"
          className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center"
        >
          <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Room Change</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Request a room transfer
          </p>
        </Link>
      </div>
    </div>
  );
}
