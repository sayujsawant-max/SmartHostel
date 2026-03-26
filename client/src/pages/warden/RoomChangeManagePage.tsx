import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { Reveal } from '@/components/motion';

import StatusBadge, { type StatusVariant } from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Building2,
  User,

  Repeat2,
  Inbox,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

interface PopulatedRoom {
  _id: string;
  block: string;
  floor: string;
  roomNumber: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
}

interface PopulatedStudent {
  _id: string;
  name: string;
  email: string;
  block?: string;
  floor?: string;
  roomNumber?: string;
}

interface PopulatedReviewer {
  _id: string;
  name: string;
}

interface RoomChangeRequest {
  _id: string;
  studentId: PopulatedStudent;
  currentRoomId: PopulatedRoom;
  requestedRoomId: PopulatedRoom;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reviewedBy?: PopulatedReviewer;
  reviewedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  COMPLETED: 'info',
};

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  COMPLETED: CheckCircle2,
};

function formatRoom(r: PopulatedRoom): string {
  return `Block ${r.block} / Floor ${r.floor} / Room ${r.roomNumber}`;
}

type FilterTab = '' | 'PENDING' | 'COMPLETED' | 'REJECTED';

export default function RoomChangeManagePage() {
  usePageTitle('Room Change Manage');
  const [requests, setRequests] = useState<RoomChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterTab>('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiFetch<{ requests: RoomChangeRequest[] }>('/room-changes');
      setRequests(res.data.requests);
    } catch (err) {
      showError(err, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/room-changes/${id}/approve`, { method: 'PATCH' });
      showSuccess('Room change approved');
      void import('@/utils/confetti').then(m => m.celebrateMini());
      void fetchRequests();
    } catch (err) {
      showError(err);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    try {
      await apiFetch(`/room-changes/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setRejectingId(null);
      setRejectReason('');
      showSuccess('Room change rejected');
      void fetchRequests();
    } catch (err) {
      showError(err);
    }
  };

  const filtered = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests;

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: '', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/10 via-[hsl(var(--card))] to-purple-600/10 border border-[hsl(var(--border))] p-6 morph-gradient"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Repeat2 className="w-24 h-24 text-indigo-500" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center"
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <ArrowRightLeft className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] gradient-heading">Room Change Requests</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Review and manage student room change requests</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Requests', value: requests.length, icon: Inbox, iconBg: 'bg-blue-100 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Pending', value: pendingCount, icon: Clock, iconBg: 'bg-amber-100 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle2, iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 * i }}
            >
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow card-glow card-shine"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      <AnimatedCounter to={stat.value} />
                    </p>
                  </div>
                  <motion.div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}
                    whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex gap-1 p-1.5 rounded-2xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={`relative flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {statusFilter === tab.key && (
              <motion.div
                layoutId="roomchange-filter-tab"
                className="absolute inset-0 bg-[hsl(var(--primary))] rounded-xl shadow-lg shadow-[hsl(var(--primary))]/20"
                transition={spring}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {loading ? (
        <PageSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState variant="compact" title="No room change requests" description="No room change requests found." />
        </motion.div>
      ) : (
        <Reveal>
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const StIcon = STATUS_ICON[r.status] ?? Clock;
            return (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.5), ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ y: -2, scale: 1.005 }}
                  transition={spring}
                  className="card-glow card-shine p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3 hover:shadow-md hover:border-[hsl(var(--accent))]/40 transition-all"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <motion.div
                        className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5"
                        whileHover={{ rotate: 12 }}
                        transition={spring}
                      >
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </motion.div>
                      <div>
                        <p className="font-medium text-[hsl(var(--foreground))]">{r.studentId.name}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {r.studentId.email}
                          {r.studentId.block && (
                            <span className="ml-1 opacity-60">
                              Block {r.studentId.block}
                              {r.studentId.roomNumber && ` / Room ${r.studentId.roomNumber}`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <StatusBadge variant={STATUS_VARIANT[r.status] ?? 'neutral'}>
                      {r.status}
                    </StatusBadge>
                  </div>

                  {/* Room Comparison */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={spring}
                      className="flex-1 min-w-[140px] p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/60"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                        <p className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] font-medium">Current Room</p>
                      </div>
                      <p className="text-xs font-medium text-[hsl(var(--foreground))]">{formatRoom(r.currentRoomId)}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{r.currentRoomId.roomType}, {r.currentRoomId.acType}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Rs. {r.currentRoomId.feePerSemester.toLocaleString('en-IN')}/sem</p>
                    </motion.div>

                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-5 h-5 text-indigo-500" />
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={spring}
                      className="flex-1 min-w-[140px] p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-medium">Requested Room</p>
                      </div>
                      <p className="text-xs font-medium text-[hsl(var(--foreground))]">{formatRoom(r.requestedRoomId)}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{r.requestedRoomId.roomType}, {r.requestedRoomId.acType}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Rs. {r.requestedRoomId.feePerSemester.toLocaleString('en-IN')}/sem</p>
                    </motion.div>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-[hsl(var(--foreground))]">{r.reason}</p>

                  {/* Rejection Reason */}
                  {r.status === 'REJECTED' && r.rejectionReason && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-sm text-[hsl(var(--destructive))] p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      Rejection reason: {r.rejectionReason}
                    </motion.div>
                  )}

                  {/* Timeline / Meta */}
                  <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] pl-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {r.reviewedBy && (
                      <span className="flex items-center gap-1">
                        <StIcon className="w-3 h-3" />
                        Reviewed by: {r.reviewedBy.name}
                      </span>
                    )}
                  </div>

                  {/* Actions for PENDING requests */}
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2 pt-1">
                      <AnimatePresence mode="wait">
                      {rejectingId === r._id ? (
                        <motion.div
                          key="reject-form"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-2 items-center flex-1"
                        >
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow"
                          />
                          <motion.button
                            onClick={() => void handleReject(r._id)}
                            disabled={!rejectReason.trim()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            className="px-3 py-1.5 rounded-lg bg-[hsl(var(--destructive))] text-white text-xs font-medium disabled:opacity-50 transition-opacity"
                          >
                            Confirm
                          </motion.button>
                          <motion.button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:underline"
                          >
                            Cancel
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="action-buttons"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-2"
                        >
                          <motion.button
                            onClick={() => void handleApprove(r._id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </motion.button>
                          <motion.button
                            onClick={() => setRejectingId(r._id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[hsl(var(--destructive))] text-white text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </motion.button>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
        </Reveal>
      )}
    </div>
  );
}
