import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';

interface FeeItem {
  _id: string;
  amount: number;
  status: string;
}

interface Leave {
  _id: string;
  status: string;
}

interface Complaint {
  _id: string;
  status: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<{ fees: FeeItem[] }>('/assistant/fees').catch(() => ({ data: { fees: [] } })),
      apiFetch<{ leaves: Leave[] }>('/leaves').catch(() => ({ data: { leaves: [] } })),
      apiFetch<{ complaints: Complaint[] }>('/complaints').catch(() => ({ data: { complaints: [] } })),
    ])
      .then(([feesRes, leavesRes, complaintsRes]) => {
        setFees(feesRes.data.fees);
        setLeaves(leavesRes.data.leaves);
        setComplaints(complaintsRes.data.complaints);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  // Fee summary
  const totalPaid = fees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fees.filter((f) => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = fees.filter((f) => f.status === 'OVERDUE').reduce((sum, f) => sum + f.amount, 0);

  // Leave stats
  const totalLeaves = leaves.length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'SCANNED_OUT' || l.status === 'SCANNED_IN').length;
  const approvedPct = totalLeaves > 0 ? Math.round((approvedCount / totalLeaves) * 100) : 0;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  // Complaint stats
  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  return (
    <div className="p-4 space-y-5">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
          <span className="text-3xl font-bold text-[hsl(var(--accent-foreground))]">{initial}</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">{user?.name}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.email}</p>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Room Info Card */}
      {user && (user.block || user.roomNumber) && (
        <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Room Info</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {user.block && (
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.block}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Block</p>
              </div>
            )}
            {user.floor && (
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.floor}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Floor</p>
              </div>
            )}
            {user.roomNumber && (
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.roomNumber}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Room</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fee Summary */}
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Fee Summary</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Paid</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-600">{totalPending.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Pending</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{totalOverdue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Overdue</p>
          </div>
        </div>
      </div>

      {/* Leave Stats */}
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Leave Stats</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-[hsl(var(--foreground))]">{totalLeaves}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{approvedPct}%</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Approved</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{rejectedCount}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Rejected</p>
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Recent Complaints</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-blue-600">{openCount}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Open</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{inProgressCount}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">In Progress</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{resolvedCount}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Resolved</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Quick Links</h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/student/actions/report-issue"
            className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Report Issue</p>
          </Link>
          <Link
            to="/student/actions/request-leave"
            className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Request Leave</p>
          </Link>
          <Link
            to="/student/faq"
            className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">FAQ</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
