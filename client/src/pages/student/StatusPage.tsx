import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';

interface FeeItem {
  _id: string;
  feeType: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  semester: string;
  academicYear: string;
}

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  target: string;
  authorId?: { _id: string; name: string };
  createdAt: string;
}

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

interface Complaint {
  _id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
}

const COMPLAINT_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
};

function SLABadge({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const due = new Date(dueAt);
  const diffMs = due.getTime() - now;
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  if (diffMs < 0) return <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Overdue {Math.abs(diffH)}h</span>;
  if (diffH <= 2) return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Due in {diffH}h</span>;
  return <span className="text-xs text-[hsl(var(--muted-foreground))]">Due in {diffH}h</span>;
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

const FEE_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  UNPAID: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getLeaveHint(status: string): { text: string; link?: { label: string; to: string } } | null {
  switch (status) {
    case 'PENDING': return { text: 'Waiting for warden approval.' };
    case 'APPROVED': return { text: 'Your pass is ready.', link: { label: 'Show QR at Gate', to: '/student/actions/show-qr' } };
    case 'REJECTED': return { text: 'Rejected.', link: { label: 'Request a New Leave', to: '/student/actions' } };
    case 'SCANNED_OUT': return { text: 'You are currently out. Return before your pass expires.' };
    default: return null;
  }
}

function getComplaintHint(status: string): string | null {
  switch (status) {
    case 'OPEN': return 'Waiting for assignment. You\'ll be notified when someone is on it.';
    case 'ASSIGNED': return 'Assigned to maintenance staff. Work will begin soon.';
    case 'IN_PROGRESS': return 'Work is in progress. You\'ll be notified when resolved.';
    case 'RESOLVED': return 'Issue resolved. Check resolution notes above.';
    default: return null;
  }
}

export default function StatusPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [showFees, setShowFees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<{ leaves: Leave[] }>('/leaves'),
      apiFetch<{ complaints: Complaint[] }>('/complaints'),
      apiFetch<{ notices: NoticeItem[] }>('/notices/my-notices').catch(() => ({ data: { notices: [] } })),
      apiFetch<{ fees: FeeItem[] }>('/assistant/fees').catch(() => ({ data: { fees: [] } })),
    ])
      .then(([leavesRes, complaintsRes, noticesRes, feesRes]) => {
        setLeaves(leavesRes.data.leaves);
        setComplaints(complaintsRes.data.complaints);
        setNotices(noticesRes.data.notices);
        setFees(feesRes.data.fees);
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

  const activeLeave = leaves.find((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');

  return (
    <div className="p-4 space-y-4">
      {/* Room Info */}
      {user && (user.block || user.roomNumber) && (
        <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
          {user.block && <span>Block {user.block}</span>}
          {user.floor && <span> · Floor {user.floor}</span>}
          {user.roomNumber && <span> · Room {user.roomNumber}</span>}
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 gap-2">
        <a href="#complaints" className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))]">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{complaints.filter((c) => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Complaints</p>
        </a>
        <a href="#leaves" className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))]">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{leaves.filter((l) => l.status === 'PENDING' || l.status === 'APPROVED' || l.status === 'SCANNED_OUT').length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Leaves</p>
        </a>
        <button onClick={() => setShowFees(!showFees)} className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))]">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{fees.filter((f) => f.status !== 'PAID').length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Pending Fees</p>
        </button>
        <Link to="/student/faq" className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center hover:bg-[hsl(var(--muted))]">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">?</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Ask a Question</p>
        </Link>
      </div>

      {/* Fee Status */}
      {showFees && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Fee Status</h2>
          {fees.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No fee records found.</p>
          ) : (
            fees.map((f) => (
              <div key={f._id} className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{f.feeType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{f.semester} · {f.academicYear}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Due {formatDate(f.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{f.currency} {f.amount.toLocaleString('en-IN')}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FEE_STATUS_COLORS[f.status] ?? ''}`}>{f.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notices */}
      {notices.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Notices</h2>
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n._id} className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <p className="font-medium text-sm text-blue-900">{n.title}</p>
                <p className="text-sm text-blue-800">{n.content}</p>
                <p className="text-xs text-blue-600">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {n.authorId?.name && ` · ${n.authorId.name}`}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 id="leaves" className="text-xl font-bold text-[hsl(var(--foreground))]">My Leaves</h2>

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
          <p>No active leaves.</p>
          <Link to="/student/actions" className="text-blue-600 mt-2 inline-block">
            Request Leave &rarr;
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
              {(() => {
                const hint = getLeaveHint(leave.status);
                if (!hint) return null;
                return (
                  <p className="text-xs text-blue-600 mt-1">
                    {hint.text}
                    {hint.link && <Link to={hint.link.to} className="ml-1 underline">{hint.link.label}</Link>}
                  </p>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Complaints Section */}
      <h2 id="complaints" className="text-xl font-bold text-[hsl(var(--foreground))] pt-4">My Complaints</h2>

      {complaints.length === 0 ? (
        <div className="text-center py-6 text-[hsl(var(--muted-foreground))]">
          <p>No complaints filed.</p>
          <Link to="/student/actions/report-issue" className="text-blue-600 mt-2 inline-block">
            Report an Issue &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Link
              key={c._id}
              to={`/student/status/complaint/${c._id}`}
              className="block border rounded-lg p-4 bg-[hsl(var(--card))] space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {c.category.replace(/_/g, ' ')}
                </span>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COMPLAINT_STATUS_COLORS[c.status] ?? ''}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[c.priority] ?? ''}`}>
                    {c.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] truncate">{c.description}</p>
              <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                <SLABadge dueAt={c.dueAt} />
                <span>Updated {formatDate(c.updatedAt)}</span>
              </div>
              {getComplaintHint(c.status) && (
                <p className="text-xs text-blue-600">{getComplaintHint(c.status)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
