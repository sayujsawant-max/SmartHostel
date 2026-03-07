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
  checkedInAt?: string;
  checkedOutAt?: string;
  studentId?: { _id: string; name: string; email: string; roomNumber?: string; block?: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800',
  CHECKED_IN: 'bg-blue-100 text-blue-800',
};

export default function VisitorCheckPage() {
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await apiFetch<VisitorItem[]>(`/visitors?date=${todayStr}`);
      // Only show APPROVED and CHECKED_IN visitors
      setVisitors(res.data.filter((v) => v.status === 'APPROVED' || v.status === 'CHECKED_IN'));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    void fetchVisitors();
  }, [fetchVisitors]);

  const handleCheckIn = async (id: string) => {
    try {
      await apiFetch(`/visitors/${id}/check-in`, { method: 'PATCH' });
      void fetchVisitors();
    } catch {
      // silently fail
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await apiFetch(`/visitors/${id}/check-out`, { method: 'PATCH' });
      void fetchVisitors();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Visitor Check-In/Out</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Manage today's approved visitors at the gate.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">No approved visitors for today.</p>
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
                {v.expectedTime && <span>Expected: {v.expectedTime}</span>}
                {v.checkedInAt && <span>In: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>

              {/* Action buttons */}
              <div className="pt-1">
                {v.status === 'APPROVED' && (
                  <button
                    onClick={() => void handleCheckIn(v._id)}
                    className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-medium"
                  >
                    Check In
                  </button>
                )}
                {v.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => void handleCheckOut(v._id)}
                    className="px-4 py-1.5 rounded bg-gray-600 text-white text-sm font-medium"
                  >
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
