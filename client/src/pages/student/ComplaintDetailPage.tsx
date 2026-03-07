import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@services/api';

interface ComplaintDetail {
  _id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  dueAt: string;
  createdAt: string;
  resolutionNotes: string | null;
  assigneeId?: { _id: string; name: string } | null;
}

interface TimelineEvent {
  _id: string;
  eventType: string;
  note: string | null;
  actorId?: { _id: string; name: string } | null;
  actorRole: string | null;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  COMPLAINT_CREATED: 'Complaint Created',
  COMPLAINT_ASSIGNED: 'Assigned',
  WORK_STARTED: 'Work Started',
  COMPLAINT_RESOLVED: 'Resolved',
  PRIORITY_CHANGED: 'Priority Changed',
  SLA_REMINDER: 'Reminder Sent',
  SLA_BREACHED: 'SLA Breached',
};

function SLABadge({ dueAt, status }: { dueAt: string; status: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (status === 'RESOLVED' || status === 'CLOSED') {
    return <span className="text-sm text-green-700 font-medium">Resolved</span>;
  }
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now;
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  if (diffMs < 0) return <span className="text-sm font-semibold text-red-700">Overdue {Math.abs(diffH)}h</span>;
  if (diffH <= 2) return <span className="text-sm font-semibold text-amber-700">Due in {diffH}h</span>;
  return <span className="text-sm text-[hsl(var(--foreground))]">Due in {diffH}h</span>;
}

export default function ComplaintDetailPage() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!complaintId) return;
    Promise.all([
      apiFetch<{ complaint: ComplaintDetail }>(`/complaints/${complaintId}`),
      apiFetch<{ events: TimelineEvent[] }>(`/complaints/${complaintId}/timeline`),
    ])
      .then(([cRes, tRes]) => {
        setComplaint(cRes.data.complaint);
        setTimeline(tRes.data.events);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [complaintId]);

  if (loading) {
    return <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading...</div>;
  }

  if (!complaint) {
    return <div className="p-4 text-center text-red-600">Complaint not found.</div>;
  }

  return (
    <div className="space-y-4">
      <Link to="/student/status" className="text-sm text-blue-600">&larr; Back to Status</Link>

      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
            {complaint.category.replace(/_/g, ' ')}
          </h2>
          <SLABadge dueAt={complaint.dueAt} status={complaint.status} />
        </div>
        <p className="text-sm text-[hsl(var(--foreground))]">{complaint.description}</p>
        <div className="flex gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>Status: {complaint.status.replace(/_/g, ' ')}</span>
          <span>Priority: {complaint.priority}</span>
        </div>
        {complaint.assigneeId && (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Assigned to: {complaint.assigneeId.name}
          </p>
        )}
        {complaint.resolutionNotes && (
          <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs font-medium text-green-800">Resolution Notes</p>
            <p className="text-sm text-green-700 mt-1">{complaint.resolutionNotes}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Timeline</h3>
        <div className="space-y-3">
          {timeline.map((event, i) => (
            <div key={event._id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${i === timeline.length - 1 ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted-foreground))]'}`} />
                {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-[hsl(var(--border))]" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {EVENT_LABELS[event.eventType] ?? event.eventType.replace(/_/g, ' ')}
                </p>
                {event.note && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{event.note}</p>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {event.actorId?.name ?? 'System'} &middot;{' '}
                  {new Date(event.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
