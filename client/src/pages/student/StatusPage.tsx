import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';

interface Leave {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  SCANNED_OUT: 'bg-blue-100 text-blue-800',
  SCANNED_IN: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StatusPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ leaves: Leave[] }>('/leaves')
      .then((res) => setLeaves(res.data.leaves))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  const activeLeave = leaves.find((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">My Leaves</h2>

      {activeLeave && (
        <Link
          to="/student/actions/show-qr"
          className="block p-4 bg-green-50 border border-green-200 rounded-lg text-center"
        >
          <p className="text-green-800 font-semibold">You have an active pass</p>
          <p className="text-green-600 text-sm mt-1">Tap to show QR code</p>
        </Link>
      )}

      {leaves.length === 0 ? (
        <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
          <p>No leave requests yet.</p>
          <Link to="/student/actions" className="text-blue-600 mt-2 inline-block">
            Request a leave
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave._id} className="border rounded-lg p-4 bg-[hsl(var(--card))]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {leave.type === 'DAY_OUTING' ? 'Day Outing' : 'Overnight'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[leave.status] ?? 'bg-gray-100'}`}>
                  {leave.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 truncate">{leave.reason}</p>
              {leave.rejectionReason && (
                <p className="text-sm text-red-600 mt-1">Reason: {leave.rejectionReason}</p>
              )}
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                Submitted {formatDate(leave.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
