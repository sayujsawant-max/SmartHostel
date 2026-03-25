import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import StatCard from '@components/ui/StatCard';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import {
  Users,
  AlertCircle,
  CalendarDays,
  Building2,
  TriangleAlert,
  ShieldAlert,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  BarChart3,
  CreditCard,
  BedDouble,
  Download,
} from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

interface DashboardStats {
  pendingLeaves: number;
  nearBreachComplaints: number;
  breachedComplaints: number;
  pendingOverrides: number;
  cronOverdue: boolean;
  lastCronRun: string | null;
}

interface OverrideStats {
  today: number;
  lastHour: number;
  spikeAlert: boolean;
  spikeMessage: string | null;
  perGuard: { guardId: string; guardName: string; count: number }[];
}

interface AnalyticsData {
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    byBlock: { block: string; total: number; occupied: number }[];
  };
  complaints: {
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    avgResolutionHours: number;
  };
  leaves: {
    byStatus: Record<string, number>;
    thisWeek: number;
    thisMonth: number;
  };
  fees: {
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
}

interface ActivityEvent {
  type: 'LEAVE' | 'COMPLAINT' | 'GATE_SCAN' | 'NOTICE';
  action: string;
  actor: string;
  detail: string;
  timestamp: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const activityDotColors: Record<ActivityEvent['type'], string> = {
  LEAVE: '#16a34a',
  COMPLAINT: '#3b82f6',
  GATE_SCAN: '#f97316',
  NOTICE: '#8b5cf6',
};

interface SosAlert {
  _id: string;
  studentId: { _id: string; name: string; email: string; block?: string; floor?: number; roomNumber?: string };
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: { _id: string; name: string };
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface OverrideItem {
  _id: string;
  reason: string;
  note: string;
  method: string;
  createdAt: string;
  guardId?: { _id: string; name: string };
  studentId?: { _id: string; name: string; block?: string };
}

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [overrideStats, setOverrideStats] = useState<OverrideStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, overridesRes, overrideStatsRes, analyticsRes, activityRes, sosRes] = await Promise.all([
        apiFetch<DashboardStats>('/admin/dashboard-stats'),
        apiFetch<OverrideItem[]>('/gate/overrides'),
        apiFetch<OverrideStats>('/gate/override-stats'),
        apiFetch<AnalyticsData>('/admin/analytics'),
        apiFetch<ActivityEvent[]>('/admin/activity-feed'),
        apiFetch<SosAlert[]>('/sos').catch(() => ({ data: [] as SosAlert[] })),
      ]);
      setDashStats(statsRes.data);
      setOverrides(overridesRes.data);
      setOverrideStats(overrideStatsRes.data);
      setAnalytics(analyticsRes.data);
      setActivityFeed(activityRes.data);
      setSosAlerts(sosRes.data);
    } catch (err) {
      showError(err, 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleReview = async (id: string) => {
    try {
      await apiFetch(`/gate/overrides/${id}/review`, { method: 'PATCH' });
      setOverrides((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      showError(err, 'Failed to review override');
    }
  };

  const handleAcknowledgeSos = async (id: string) => {
    try {
      await apiFetch(`/sos/${id}/acknowledge`, { method: 'PATCH' });
      setSosAlerts((prev) => prev.map((a) => a._id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a));
    } catch (err) {
      showError(err, 'Failed to acknowledge SOS');
    }
  };

  const handleResolveSos = async (id: string) => {
    try {
      await apiFetch(`/sos/${id}/resolve`, { method: 'PATCH' });
      setSosAlerts((prev) => prev.map((a) => a._id === id ? { ...a, status: 'RESOLVED' as const } : a));
    } catch (err) {
      showError(err, 'Failed to resolve SOS');
    }
  };

  const activeSosAlerts = sosAlerts.filter((a) => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED');

  const allClear = dashStats &&
    dashStats.pendingLeaves === 0 &&
    dashStats.nearBreachComplaints === 0 &&
    dashStats.breachedComplaints === 0 &&
    dashStats.pendingOverrides === 0 &&
    !dashStats.cronOverdue;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader
          title="Warden Dashboard"
          description="Manage your hostel operations"
        />
      </motion.div>

      {/* Top Stats Row - matching Figma */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Students',
              value: analytics.occupancy.occupiedBeds,
              change: dashStats?.pendingLeaves ? `+${dashStats.pendingLeaves}` : undefined,
              changeColor: 'text-emerald-600 dark:text-emerald-400',
              icon: Users,
              iconBg: 'bg-blue-100 dark:bg-blue-950/40',
              iconColor: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Active Complaints',
              value: Object.values(analytics.complaints.byStatus).reduce((a, b) => a + b, 0) - (analytics.complaints.byStatus['RESOLVED'] ?? 0),
              change: dashStats?.nearBreachComplaints ? `-${dashStats.nearBreachComplaints}` : undefined,
              changeColor: 'text-rose-600 dark:text-rose-400',
              icon: AlertCircle,
              iconBg: 'bg-orange-100 dark:bg-orange-950/40',
              iconColor: 'text-orange-600 dark:text-orange-400',
            },
            {
              label: 'Pending Leaves',
              value: dashStats?.pendingLeaves ?? 0,
              change: dashStats?.pendingLeaves ? `+${dashStats.pendingLeaves}` : undefined,
              changeColor: 'text-emerald-600 dark:text-emerald-400',
              icon: CalendarDays,
              iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
              iconColor: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Occupancy Rate',
              value: analytics.occupancy.occupancyRate,
              suffix: '%',
              change: '+3%',
              changeColor: 'text-emerald-600 dark:text-emerald-400',
              icon: Building2,
              iconBg: 'bg-amber-100 dark:bg-amber-950/40',
              iconColor: 'text-amber-600 dark:text-amber-400',
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={spring}
                  className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow card-glow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                          <AnimatedCounter to={stat.value} />
                          {stat.suffix}
                        </p>
                        {stat.change && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + 0.08 * i }}
                            className={`text-xs font-medium ${stat.changeColor}`}
                          >
                            {stat.change}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <motion.div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}
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
      )}

      {/* SOS Alerts */}
      <AnimatePresence>
        {activeSosAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20 p-4"
          >
            <style>{`
              @keyframes sosBorderPulse {
                0%, 100% { border-color: #ef4444; }
                50% { border-color: #fca5a5; }
              }
              .sos-alert-active {
                animation: sosBorderPulse 1.5s ease-in-out infinite;
              }
            `}</style>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <TriangleAlert className="w-5 h-5 text-red-600" />
              </motion.div>
              SOS Alerts
              <StatusBadge variant="error">{activeSosAlerts.length}</StatusBadge>
            </h3>
            <div className="space-y-3">
              {activeSosAlerts.map((alert, i) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 * i }}
                  className={`p-3 rounded-xl bg-white dark:bg-[hsl(var(--card))] border ${alert.status === 'ACTIVE' ? 'border-red-400 sos-alert-active' : 'border-orange-300 dark:border-orange-800/40'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-red-900 dark:text-red-200">
                        {alert.studentId?.name ?? 'Unknown Student'}
                      </p>
                      {(alert.studentId?.block || alert.studentId?.roomNumber) && (
                        <p className="text-xs text-red-700 dark:text-red-400">
                          {alert.studentId.block && `Block ${alert.studentId.block}`}
                          {alert.studentId.floor != null && `, Floor ${alert.studentId.floor}`}
                          {alert.studentId.roomNumber && `, Room ${alert.studentId.roomNumber}`}
                        </p>
                      )}
                      <p className="text-sm text-red-800 dark:text-red-300 mt-1">{alert.message}</p>
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">{timeAgo(alert.createdAt)}</p>
                      {alert.status === 'ACKNOWLEDGED' && (
                        <p className="text-xs text-orange-600 mt-0.5">Acknowledged</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {alert.status === 'ACTIVE' && (
                        <motion.button
                          onClick={() => void handleAcknowledgeSos(alert._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={spring}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
                        >
                          Acknowledge
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => void handleResolveSos(alert._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Needs Attention Widget */}
      {allClear ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-4 rounded-2xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">All clear — no pending items or alerts right now.</p>
          </div>
        </motion.div>
      ) : dashStats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            dashStats.pendingLeaves > 0 && {
              to: '/warden/students',
              value: dashStats.pendingLeaves,
              label: 'Pending Leaves',
              bg: 'bg-yellow-50 dark:bg-yellow-950/20',
              border: 'border-yellow-200 dark:border-yellow-800/40',
              textColor: 'text-yellow-800 dark:text-yellow-200',
              subColor: 'text-yellow-700 dark:text-yellow-400',
            },
            dashStats.nearBreachComplaints > 0 && {
              to: '/warden/complaints',
              value: dashStats.nearBreachComplaints,
              label: 'Near-Breach (<6h)',
              bg: 'bg-amber-50 dark:bg-amber-950/20',
              border: 'border-amber-200 dark:border-amber-800/40',
              textColor: 'text-amber-800 dark:text-amber-200',
              subColor: 'text-amber-700 dark:text-amber-400',
            },
            dashStats.breachedComplaints > 0 && {
              to: '/warden/complaints',
              value: dashStats.breachedComplaints,
              label: 'SLA Breached',
              bg: 'bg-red-50 dark:bg-red-950/20',
              border: 'border-red-200 dark:border-red-800/40',
              textColor: 'text-red-800 dark:text-red-200',
              subColor: 'text-red-700 dark:text-red-400',
            },
            dashStats.pendingOverrides > 0 && {
              value: dashStats.pendingOverrides,
              label: 'Overrides to Review',
              bg: 'bg-orange-50 dark:bg-orange-950/20',
              border: 'border-orange-200 dark:border-orange-800/40',
              textColor: 'text-orange-800 dark:text-orange-200',
              subColor: 'text-orange-700 dark:text-orange-400',
            },
          ].filter(Boolean).map((item, i) => {
            const card = item as { to?: string; value: number; label: string; bg: string; border: string; textColor: string; subColor: string };
            const inner = (
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                transition={spring}
                className={`p-3 rounded-xl ${card.bg} border ${card.border} text-center hover:shadow-sm transition-shadow`}
              >
                <p className={`text-2xl font-bold ${card.textColor}`}><AnimatedCounter to={card.value} /></p>
                <p className={`text-xs ${card.subColor}`}>{card.label}</p>
              </motion.div>
            );
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 * i }}
              >
                {card.to ? <Link to={card.to} className="block">{inner}</Link> : inner}
              </motion.div>
            );
          })}
          {dashStats.cronOverdue && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
              className="p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/40 text-center col-span-2"
            >
              <p className="text-sm font-medium text-red-800 dark:text-red-200">SLA automation unhealthy</p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Last cron: {dashStats.lastCronRun
                  ? new Date(dashStats.lastCronRun).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Never'}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Override Spike Alert */}
      <AnimatePresence>
        {overrideStats?.spikeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/40 text-red-800 dark:text-red-300"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5" />
              <p className="font-semibold">{overrideStats.spikeMessage}</p>
            </div>
            {overrideStats.perGuard.length > 0 && (
              <div className="mt-2 text-sm">
                {overrideStats.perGuard.map((g) => (
                  <p key={g.guardId}>{g.guardName}: {g.count} override{g.count > 1 ? 's' : ''} today</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Override Stats (non-spike) */}
      {overrideStats && !overrideStats.spikeAlert && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="grid grid-cols-2 gap-4"
        >
          <StatCard value={overrideStats.today} label="Overrides today" />
          <StatCard value={overrideStats.lastHour} label="Last hour" />
        </motion.div>
      )}

      {/* Overrides Pending Review */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4"
      >
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          Overrides Pending Review
          {overrides.length > 0 && (
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-1 text-sm font-normal px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            >
              {overrides.length}
            </motion.span>
          )}
        </h3>

        {overrides.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No overrides pending review</p>
        ) : (
          <div className="space-y-3">
            {overrides.map((o, i) => (
              <motion.div
                key={o._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
              >
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={spring}
                  className="p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] hover:shadow-sm transition-shadow space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">
                        {o.studentId?.name ?? 'Unknown Student'}
                        {o.studentId?.block && <span className="text-xs opacity-60 ml-1">Block {o.studentId.block}</span>}
                      </p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {o.reason} — {o.method.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{o.note}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Guard: {o.guardId?.name ?? 'Unknown'} &middot; {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => void handleReview(o._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={spring}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium shrink-0 hover:bg-indigo-700 transition-colors"
                    >
                      Mark Reviewed
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ===== Analytics Section ===== */}
      {analytics && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mt-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Analytics
            </h3>
          </motion.div>

          {/* Overview Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Occupancy Rate — circular progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ y: -3 }}
                transition={spring}
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center hover:shadow-md transition-shadow"
              >
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - analytics.occupancy.occupancyRate / 100) }}
                    transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
                    transform="rotate(-90 40 40)"
                  />
                  <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                    {analytics.occupancy.occupancyRate}%
                  </text>
                </svg>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Occupancy Rate</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              <motion.div whileHover={{ y: -3 }} transition={spring} className="hover:shadow-md transition-shadow rounded-2xl">
                <StatCard value={analytics.occupancy.occupiedBeds} label={`of ${analytics.occupancy.totalBeds} beds`} />
              </motion.div>
            </motion.div>

            {/* Fee Collection Rate — circular progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ y: -3 }}
                transition={spring}
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center hover:shadow-md transition-shadow"
              >
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="hsl(var(--accent))" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - analytics.fees.collectionRate / 100) }}
                    transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
                    transform="rotate(-90 40 40)"
                  />
                  <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">
                    {analytics.fees.collectionRate}%
                  </text>
                </svg>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Fee Collection</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 }}
            >
              <motion.div whileHover={{ y: -3 }} transition={spring} className="hover:shadow-md transition-shadow rounded-2xl">
                <StatCard value={analytics.complaints.avgResolutionHours} label="Avg Resolution Time" suffix="h" />
              </motion.div>
            </motion.div>
          </div>

          {/* Occupancy by Block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
          >
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-indigo-500" />
              Occupancy by Block
            </h4>
            <div className="space-y-2">
              {analytics.occupancy.byBlock.map((b, i) => (
                <motion.div
                  key={b.block}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.75 + 0.05 * i }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] w-16">Block {b.block}</span>
                  <div className="flex-1 h-5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'hsl(var(--primary))' }}
                      initial={{ width: 0 }}
                      animate={{ width: b.total > 0 ? `${(b.occupied / b.total) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: 0.8 + 0.05 * i, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 text-right">{b.occupied}/{b.total}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Complaints by Status (Pie) + Category (Bar) — Interactive Recharts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.75 }}
              className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
            >
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                Complaints by Status
              </h4>
              {(() => {
                const statusColors: Record<string, string> = { OPEN: '#3b82f6', ASSIGNED: '#8b5cf6', IN_PROGRESS: '#f59e0b', RESOLVED: '#16a34a', CLOSED: '#6b7280' };
                const data = Object.entries(analytics.complaints.byStatus).map(([name, value]) => ({
                  name: name.replace(/_/g, ' '),
                  value,
                  color: statusColors[name] ?? '#6b7280',
                }));
                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {data.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {Object.entries(analytics.complaints.byStatus).map(([status, count]) => {
                  const statusColors: Record<string, string> = { OPEN: '#3b82f6', ASSIGNED: '#8b5cf6', IN_PROGRESS: '#f59e0b', RESOLVED: '#16a34a', CLOSED: '#6b7280' };
                  return (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-[hsl(var(--foreground))]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[status] ?? '#6b7280' }} />
                      {status.replace(/_/g, ' ')} ({count})
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
            >
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-violet-500" />
                Complaints by Category
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(analytics.complaints.byCategory).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Leave Summary — Interactive Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.85 }}
            className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
          >
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              Leave Summary
            </h4>
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  <AnimatedCounter to={analytics.leaves.thisWeek} />
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  <AnimatedCounter to={analytics.leaves.thisMonth} />
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">This Month</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={Object.entries(analytics.leaves.byStatus).map(([name, value]) => ({ name, value }))}
                margin={{ top: 5, right: 5, bottom: 5, left: -15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="value" animationDuration={800} radius={[4, 4, 0, 0]}>
                  {Object.keys(analytics.leaves.byStatus).map((status, i) => {
                    const colors: Record<string, string> = { PENDING: '#f59e0b', APPROVED: '#16a34a', REJECTED: '#ef4444', COMPLETED: '#3b82f6', CANCELLED: '#6b7280', SCANNED_OUT: '#06b6d4', SCANNED_IN: '#14b8a6' };
                    return <Cell key={i} fill={colors[status] ?? '#6b7280'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Fee Collection */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
          >
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Fee Collection
            </h4>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[hsl(var(--muted-foreground))]">
                Collected: <span className="font-medium text-[hsl(var(--foreground))]">₹{analytics.fees.totalCollected.toLocaleString('en-IN')}</span>
              </span>
              <span className="text-[hsl(var(--muted-foreground))]">
                Pending: <span className="font-medium text-[hsl(var(--foreground))]">₹{analytics.fees.totalPending.toLocaleString('en-IN')}</span>
              </span>
            </div>
            <div className="h-6 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'hsl(var(--accent))' }}
                initial={{ width: 0 }}
                animate={{ width: `${analytics.fees.collectionRate}%` }}
                transition={{ duration: 1, delay: 0.95, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 text-center">{analytics.fees.collectionRate}% collected</p>
          </motion.div>
        </>
      )}

      {/* ===== Live Activity Feed ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.95 }}
        className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Live Activity Feed
          </h3>
          <motion.button
            onClick={() => void fetchData()}
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="p-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>

        {activityFeed.length === 0 ? (
          <EmptyState variant="compact" title="No recent activity" description="Activity events will appear here as they happen." />
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {activityFeed.map((event, idx) => (
              <motion.div
                key={`${event.type}-${event.timestamp}-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.5) }}
                whileHover={{ x: 3, backgroundColor: 'hsl(var(--muted))' }}
                className="flex items-start gap-3 p-2 rounded-lg transition-colors cursor-default"
              >
                <span
                  className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activityDotColors[event.type] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    <span className="font-semibold">{event.action}</span>
                    <span className="text-[hsl(var(--muted-foreground))]"> — {event.actor}</span>
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{event.detail}</p>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5">{timeAgo(event.timestamp)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
