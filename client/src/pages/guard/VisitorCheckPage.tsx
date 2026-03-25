import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  UserCheck,
  LogIn,
  LogOut,
  Phone,
  Clock,
  Building2,
  Users,
} from 'lucide-react';

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

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  APPROVED: 'accent',
  CHECKED_IN: 'info',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

export default function VisitorCheckPage() {
  usePageTitle('Visitor Check');
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await apiFetch<VisitorItem[]>(`/visitors?date=${todayStr}`);
      setVisitors(res.data.filter((v) => v.status === 'APPROVED' || v.status === 'CHECKED_IN'));
    } catch (err) {
      showError(err, 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    void fetchVisitors();
  }, [fetchVisitors]);

  const handleCheckIn = async (id: string) => {
    setActionId(id);
    try {
      await apiFetch(`/visitors/${id}/check-in`, { method: 'PATCH' });
      showSuccess('Visitor checked in');
      void fetchVisitors();
    } catch (err) {
      showError(err);
    } finally {
      setActionId(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    setActionId(id);
    try {
      await apiFetch(`/visitors/${id}/check-out`, { method: 'PATCH' });
      showSuccess('Visitor checked out');
      void fetchVisitors();
    } catch (err) {
      showError(err);
    } finally {
      setActionId(null);
    }
  };

  const approvedCount = visitors.filter((v) => v.status === 'APPROVED').length;
  const checkedInCount = visitors.filter((v) => v.status === 'CHECKED_IN').length;

  return (
    <div className="space-y-5 p-4">
      <motion.div
        initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader
          title="Visitor Check-In/Out"
          description="Manage today's approved visitors at the gate."
        />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Awaiting Check-In', value: approvedCount, icon: Users, bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', cardBg: 'bg-blue-50/50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800/40' },
          { label: 'Currently Inside', value: checkedInCount, icon: UserCheck, bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/40' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border ${stat.border} ${stat.cardBg}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stat.text} leading-tight`}>{stat.value}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {loading ? (
        <PageSkeleton />
      ) : visitors.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState variant="compact" title="No approved visitors for today" description="Approved visitors will appear here." />
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {visitors.map((v, i) => (
              <motion.div
                key={v._id}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.35, delay: 0.06 * i }}
                layout
              >
                <motion.div
                  whileHover={{ y: -2, scale: 1.012 }}
                  transition={spring}
                  className={`p-4 rounded-2xl border space-y-3 transition-shadow hover:shadow-md ${
                    v.status === 'CHECKED_IN'
                      ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-800/40'
                      : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] card-glow'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        v.status === 'CHECKED_IN'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {v.visitorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[hsl(var(--foreground))]">{v.visitorName}</p>
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                          <Phone className="w-3 h-3" />
                          <span>{v.visitorPhone}</span>
                          <span>·</span>
                          <span>{v.relationship}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge variant={STATUS_VARIANT[v.status] ?? 'neutral'}>
                      {v.status.replace(/_/g, ' ')}
                    </StatusBadge>
                  </div>

                  {v.studentId && (
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>
                        {v.studentId.name}
                        {v.studentId.block && ` · Block ${v.studentId.block}`}
                        {v.studentId.roomNumber && ` · Room ${v.studentId.roomNumber}`}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-[hsl(var(--foreground))]">{v.purpose}</p>

                  <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {v.expectedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Expected: {v.expectedTime}
                      </span>
                    )}
                    {v.checkedInAt && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <LogIn className="w-3 h-3" />
                        In: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    {v.status === 'APPROVED' && (
                      <motion.button
                        onClick={() => void handleCheckIn(v._id)}
                        disabled={actionId === v._id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        {actionId === v._id ? 'Checking in...' : 'Check In'}
                      </motion.button>
                    )}
                    {v.status === 'CHECKED_IN' && (
                      <motion.button
                        onClick={() => void handleCheckOut(v._id)}
                        disabled={actionId === v._id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium hover:bg-[hsl(var(--muted))]/80 disabled:opacity-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {actionId === v._id ? 'Checking out...' : 'Check Out'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
