import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

interface VisitorItem {
  _id: string;
  visitorName: string;
  visitorPhone: string;
  relationship: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  status: string;
  rejectionReason?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  approvedBy?: { _id: string; name: string } | null;
  studentId?: { _id: string; name: string; email: string; roomNumber?: string; block?: string } | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CHECKED_IN: 'bg-blue-100 text-blue-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

type FilterTab = 'ALL' | 'PENDING' | 'TODAY';

export default function VisitorManagePage() {
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchVisitors = useCallback(async () => {
    try {
      let query = '';
      if (activeTab === 'PENDING') query = '?status=PENDING';
      else if (activeTab === 'TODAY') query = `?date=${todayStr}`;

      const res = await apiFetch<VisitorItem[]>(`/visitors${query}`);
      setVisitors(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab, todayStr]);

  useEffect(() => {
    setLoading(true);
    void fetchVisitors();
  }, [fetchVisitors]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/visitors/${id}/approve`, { method: 'PATCH' });
      void fetchVisitors();
    } catch {
      // silently fail
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch(`/visitors/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectingId(null);
      setRejectReason('');
      void fetchVisitors();
    } catch {
      // silently fail
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'TODAY', label: "Today's Visitors" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Visitor Management</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Review and manage visitor registrations.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No visitors found.</p>
      ) : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div key={v._id} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">{v.visitorName}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {v.visitorPhone} &middot; {v.relationship}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] ?? ''}`}>
                  {v.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Student info */}
              {v.studentId && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Student: {v.studentId.name}
                  {v.studentId.block && <span className="ml-1 opacity-60">Block {v.studentId.block}</span>}
                  {v.studentId.roomNumber && <span className="ml-1 opacity-60">Room {v.studentId.roomNumber}</span>}
                </p>
              )}

              <p className="text-sm text-[hsl(var(--foreground))]">{v.purpose}</p>

              <div className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap gap-3">
                <span>Date: {new Date(v.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {v.expectedTime && <span>Time: {v.expectedTime}</span>}
                {v.checkedInAt && <span>Checked in: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                {v.checkedOutAt && <span>Checked out: {new Date(v.checkedOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>

              {v.status === 'REJECTED' && v.rejectionReason && (
                <p className="text-xs text-red-600">Rejection reason: {v.rejectionReason}</p>
              )}

              {/* Actions for PENDING visitors */}
              {v.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  {rejectingId === v._id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-[hsl(var(--foreground))]"
                      />
                      <button
                        onClick={() => void handleReject(v._id)}
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-2 py-1 text-xs text-[hsl(var(--muted-foreground))]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => void handleApprove(v._id)}
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(v._id)}
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
