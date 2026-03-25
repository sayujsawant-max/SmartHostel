import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge, { type StatusVariant } from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

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

const STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CHECKED_IN: 'info',
  CHECKED_OUT: 'neutral',
  EXPIRED: 'neutral',
};

type FilterTab = 'ALL' | 'PENDING' | 'TODAY';

export default function VisitorManagePage() {
  usePageTitle('Visitor Manage');
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
    } catch (err) {
      showError(err, 'Failed to load data');
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
      showSuccess('Visitor approved');
      void import('@/utils/confetti').then(m => m.celebrateMini());
      void fetchVisitors();
    } catch (err) {
      showError(err);
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
      showSuccess('Visitor rejected');
      void fetchVisitors();
    } catch (err) {
      showError(err);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'TODAY', label: "Today's Visitors" },
  ];

  const totalToday = visitors.filter((v) => v.expectedDate?.startsWith(todayStr)).length;
  const checkedInCount = visitors.filter((v) => v.status === 'CHECKED_IN').length;
  const pendingCount = visitors.filter((v) => v.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600/10 via-[hsl(var(--card))] to-cyan-600/10 border border-[hsl(var(--border))] p-6"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Users className="w-24 h-24 text-teal-500" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center"
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Visitor Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Review and manage visitor registrations</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Visitors Today', value: totalToday, icon: CalendarDays, iconBg: 'bg-blue-100 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Checked In', value: checkedInCount, icon: UserCheck, iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending', value: pendingCount, icon: Clock, iconBg: 'bg-amber-100 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400' },
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
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow card-glow"
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

      {/* Filter Tabs with animated indicator */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex gap-1 p-1.5 rounded-2xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={`relative flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="visitor-filter-tab"
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
      ) : visitors.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState variant="compact" title="No visitors found" description="No visitor registrations match the current filter." />
        </motion.div>
      ) : (
        <div className="space-y-3">
          {visitors.map((v, i) => (
            <motion.div
              key={v._id}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.5), ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.005 }}
                transition={spring}
                className="card-glow p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3 hover:shadow-md hover:border-[hsl(var(--accent))]/40 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {/* Avatar placeholder */}
                    <motion.div
                      className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center shrink-0 text-sm font-bold text-teal-600 dark:text-teal-400"
                      whileHover={{ scale: 1.1 }}
                      transition={spring}
                    >
                      {v.visitorName.charAt(0).toUpperCase()}
                    </motion.div>
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">{v.visitorName}</p>
                      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                        <Phone className="w-3 h-3" />
                        {v.visitorPhone}
                        <span className="opacity-60">&middot;</span>
                        {v.relationship}
                      </div>
                    </div>
                  </div>
                  <StatusBadge variant={STATUS_VARIANT[v.status] ?? 'neutral'}>
                    {v.status.replace(/_/g, ' ')}
                  </StatusBadge>
                </div>

                {/* Student info */}
                {v.studentId && (
                  <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] pl-13">
                    <User className="w-3.5 h-3.5" />
                    Student: {v.studentId.name}
                    {v.studentId.block && <span className="opacity-60">Block {v.studentId.block}</span>}
                    {v.studentId.roomNumber && <span className="opacity-60">Room {v.studentId.roomNumber}</span>}
                  </div>
                )}

                <p className="text-sm text-[hsl(var(--foreground))]">{v.purpose}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(v.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {v.expectedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {v.expectedTime}
                    </span>
                  )}
                  {v.checkedInAt && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <LogIn className="w-3 h-3" />
                      In: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {v.checkedOutAt && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <LogOut className="w-3 h-3" />
                      Out: {new Date(v.checkedOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {v.status === 'REJECTED' && v.rejectionReason && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-[hsl(var(--destructive))] p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40"
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    Rejection reason: {v.rejectionReason}
                  </motion.div>
                )}

                {/* Actions for PENDING visitors */}
                {v.status === 'PENDING' && (
                  <div className="flex gap-2 pt-1">
                    <AnimatePresence mode="wait">
                    {rejectingId === v._id ? (
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
                          onClick={() => void handleReject(v._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={spring}
                          className="px-3 py-1.5 rounded-lg bg-[hsl(var(--destructive))] text-white text-xs font-medium"
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
                          onClick={() => void handleApprove(v._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={spring}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </motion.button>
                        <motion.button
                          onClick={() => setRejectingId(v._id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
