import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import FilterPanel from '@components/ui/FilterPanel';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface StaffMember {
  _id: string;
  name: string;
}

interface ComplaintItem {
  _id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  dueAt: string;
  createdAt: string;
  studentId?: { _id: string; name: string; block?: string; roomNumber?: string };
  assigneeId?: { _id: string; name: string } | null;
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: 'info',
  ASSIGNED: 'accent',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'success',
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [complaintsRes, staffRes] = await Promise.all([
        apiFetch<{ complaints: ComplaintItem[] }>(`/complaints${params}`),
        apiFetch<{ staff: StaffMember[] }>('/complaints/maintenance-staff'),
      ]);
      setComplaints(complaintsRes.data.complaints);
      setStaff(staffRes.data.staff);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAssign = async (complaintId: string) => {
    if (!selectedStaff) return;
    try {
      await apiFetch(`/complaints/${complaintId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId: selectedStaff }),
      });
      setAssigningId(null);
      setSelectedStaff('');
      void fetchData();
    } catch {
      // silently fail
    }
  };

  const handlePriorityChange = async (complaintId: string, priority: string) => {
    try {
      await apiFetch(`/complaints/${complaintId}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
      void fetchData();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader
          title="Complaints"
          description="Review, assign, and manage complaints."
          action={
            <FilterPanel.Select value={statusFilter} onChange={setStatusFilter}>
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </FilterPanel.Select>
          }
        />
      </Reveal>

      {loading ? (
        <PageSkeleton />
      ) : complaints.length === 0 ? (
        <EmptyState variant="compact" title="No complaints found" description="No complaints match the current filter." />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div
              key={c._id}
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {c.category.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {c.studentId?.name ?? 'Unknown'}
                    {c.studentId?.block && <span className="ml-1 opacity-60">Block {c.studentId.block}</span>}
                    {c.studentId?.roomNumber && <span className="ml-1 opacity-60">Room {c.studentId.roomNumber}</span>}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <StatusBadge variant={STATUS_VARIANT[c.status] ?? 'neutral'}>
                    {c.status.replace(/_/g, ' ')}
                  </StatusBadge>
                  <StatusBadge variant={PRIORITY_VARIANT[c.priority] ?? 'neutral'}>
                    {c.priority}
                  </StatusBadge>
                </div>
              </div>

              <p className="text-sm text-[hsl(var(--foreground))]">{c.description}</p>

              <div className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap gap-3">
                <span>Due: {new Date(c.dueAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {c.assigneeId && <span>Assigned to: {c.assigneeId.name}</span>}
                <span>{new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Actions for OPEN complaints */}
              {c.status === 'OPEN' && (
                <div className="flex gap-2 pt-1">
                  {assigningId === c._id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm"
                      >
                        <option value="">Select staff...</option>
                        {staff.map((s) => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => void handleAssign(c._id)}
                        disabled={!selectedStaff}
                        className="px-3 py-1 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setAssigningId(null); setSelectedStaff(''); }}
                        className="px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningId(c._id)}
                      className="px-3 py-1 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Assign
                    </button>
                  )}

                  <select
                    value={c.priority}
                    onChange={(e) => void handlePriorityChange(c._id, e.target.value)}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
