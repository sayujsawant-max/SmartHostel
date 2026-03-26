import { useState, useEffect } from 'react';
import { usePageTitle } from '@hooks/usePageTitle';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import {
  Flame,
  HeartPulse,
  ShieldAlert,
  CloudLightning,
  Lock,
  AlertOctagon,
  CheckCircle2,
  Send,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

type AlertType = 'fire' | 'medical' | 'security' | 'natural_disaster' | 'lockdown' | 'other';
type Severity = 'low' | 'medium' | 'high' | 'critical';
type TargetScope = 'all' | 'block' | 'floor';

interface ActiveAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: Severity;
  target: string;
  createdAt: string;
  status: string;
}

const ALERT_TYPES: { value: AlertType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'fire', label: 'Fire', icon: Flame, color: 'text-orange-500' },
  { value: 'medical', label: 'Medical', icon: HeartPulse, color: 'text-red-500' },
  { value: 'security', label: 'Security', icon: ShieldAlert, color: 'text-blue-500' },
  { value: 'natural_disaster', label: 'Natural Disaster', icon: CloudLightning, color: 'text-yellow-500' },
  { value: 'lockdown', label: 'Lockdown', icon: Lock, color: 'text-purple-500' },
  { value: 'other', label: 'Other', icon: AlertOctagon, color: 'text-[hsl(var(--muted-foreground))]' },
];

const SEVERITIES: { value: Severity; label: string; bg: string; activeBg: string }[] = [
  { value: 'low', label: 'Low', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', activeBg: 'bg-emerald-500 text-white' },
  { value: 'medium', label: 'Medium', bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', activeBg: 'bg-yellow-500 text-white' },
  { value: 'high', label: 'High', bg: 'bg-orange-500/10 text-orange-500 border-orange-500/30', activeBg: 'bg-orange-500 text-white' },
  { value: 'critical', label: 'Critical', bg: 'bg-red-500/10 text-red-500 border-red-500/30', activeBg: 'bg-red-500 text-white' },
];

const TARGET_SCOPES: { value: TargetScope; label: string; description: string }[] = [
  { value: 'all', label: 'All Students', description: 'Notify every student in the hostel' },
  { value: 'block', label: 'Specific Block', description: 'Notify students in a particular block' },
  { value: 'floor', label: 'Specific Floor', description: 'Notify students on a specific floor' },
];

function severityBadge(severity: Severity) {
  const s = SEVERITIES.find((sv) => sv.value === severity);
  return s?.activeBg ?? 'bg-[hsl(var(--muted))]';
}

function alertTypeBadge(type: AlertType) {
  const a = ALERT_TYPES.find((at) => at.value === type);
  return { color: a?.color ?? '', label: a?.label ?? type, Icon: (a?.icon ?? AlertOctagon) as React.ComponentType<{ className?: string }> };
}

export default function EmergencyPage() {
  usePageTitle('Emergency');
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [sending, setSending] = useState(false);

  // Form state
  const [alertType, setAlertType] = useState<AlertType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetScope, setTargetScope] = useState<TargetScope>('all');
  const [targetValue, setTargetValue] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    fetchActiveAlerts();
  }, []);

  async function fetchActiveAlerts() {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/emergency-alerts?status=ACTIVE');
      const raw: any = res.data;
      // Extract array from various possible response shapes
      let list: ActiveAlert[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.alerts)) {
        list = raw.alerts;
      }
      // Normalize fields: API returns _id/UPPERCASE, frontend expects id/lowercase
      setActiveAlerts(
        list.map((a: any) => ({
          id: a._id ?? a.id ?? '',
          type: (a.type ?? '').toLowerCase() as AlertType,
          title: a.title ?? '',
          description: a.description ?? '',
          severity: (a.severity ?? '').toLowerCase() as Severity,
          target: a.targetValue ?? a.targetScope ?? 'all',
          createdAt: a.createdAt ?? '',
          status: a.status ?? '',
        })),
      );
    } catch {
      showError('Failed to load active alerts');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setAlertType(null);
    setSeverity(null);
    setTitle('');
    setDescription('');
    setTargetScope('all');
    setTargetValue('');
  }

  async function handleSendAlert() {
    if (!alertType || !severity || !title.trim()) {
      showError('Please fill in alert type, severity, and title');
      return;
    }

    setSending(true);
    try {
      await apiFetch('/admin/emergency-alerts', {
        method: 'POST',
        body: JSON.stringify({
          type: alertType,
          severity,
          title: title.trim(),
          description: description.trim(),
          targetScope,
          targetValue: targetScope !== 'all' ? targetValue : undefined,
        }),
      });

      setSuccessVisible(true);
      setTimeout(() => {
        setSuccessVisible(false);
        resetForm();
      }, 2000);

      showSuccess('Emergency alert sent successfully');
      fetchActiveAlerts();
    } catch {
      showError('Failed to send emergency alert');
    } finally {
      setSending(false);
    }
  }

  async function handleResolveAlert(alertId: string) {
    try {
      await apiFetch(`/admin/emergency-alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      showSuccess('Alert resolved');
      setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      showError('Failed to resolve alert');
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const canSend = alertType && severity && title.trim();

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Reveal>
        <PageHeader
          title="Emergency Alerts"
          subtitle="Send critical alerts to hostel residents"
          icon={
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <AlertOctagon className="w-6 h-6 text-red-500" />
            </motion.div>
          }
        />
      </Reveal>

      <div className="mx-auto w-full max-w-5xl px-4 flex flex-col gap-8">
        {/* Success Overlay */}
        <AnimatePresence>
          {successVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={spring}
                className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring, delay: 0.15 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Button - Big, Centered, Pulsing */}
        <Reveal>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={spring}
              onClick={handleSendAlert}
              disabled={!canSend || sending}
              className="relative px-12 py-5 rounded-2xl bg-red-600 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed breathe-glow"
            >
              {/* Pulsing glow */}
              <motion.span
                className="absolute inset-0 rounded-2xl bg-red-500"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(239,68,68,0.3)',
                    '0 0 60px rgba(239,68,68,0.6)',
                    '0 0 20px rgba(239,68,68,0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ zIndex: -1 }}
              />
              <span className="flex items-center gap-3">
                <Send className="w-5 h-5" />
                {sending ? 'SENDING...' : 'SEND EMERGENCY ALERT'}
              </span>
            </motion.button>
          </div>
        </Reveal>

        {/* Alert Type Selector */}
        <Reveal>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
              Alert Type
            </h3>
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ALERT_TYPES.map((at) => {
                const Icon = at.icon;
                const selected = alertType === at.value;
                return (
                  <StaggerItem key={at.value}>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={() => setAlertType(at.value)}
                      className={`w-full flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${
                        selected
                          ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--accent))]/40'
                      }`}
                    >
                      <Icon className={`w-7 h-7 ${at.color}`} />
                      <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                        {at.label}
                      </span>
                    </motion.button>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </Reveal>

        {/* Severity Selector */}
        <Reveal>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
              Severity
            </h3>
            <div className="flex flex-wrap gap-3">
              {SEVERITIES.map((sv) => {
                const selected = severity === sv.value;
                return (
                  <motion.button
                    key={sv.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                    onClick={() => setSeverity(sv.value)}
                    className={`px-5 py-2 rounded-xl border font-medium text-sm transition-colors ${
                      selected ? sv.activeBg : sv.bg
                    } ${
                      sv.value === 'critical' && !selected ? 'border-red-500/30' : 'border-transparent'
                    }`}
                  >
                    {sv.value === 'critical' && (
                      <motion.span
                        className="inline-block"
                        animate={!selected ? { opacity: [1, 0.5, 1] } : {}}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        {sv.label}
                      </motion.span>
                    )}
                    {sv.value !== 'critical' && sv.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Message Input */}
        <Reveal>
          <div className="card-glow glass-card rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
              Alert Message
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Alert title..."
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the emergency situation in detail..."
                rows={4}
                className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>
          </div>
        </Reveal>

        {/* Target Scope */}
        <Reveal>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
              Target Scope
            </h3>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TARGET_SCOPES.map((ts) => {
                const selected = targetScope === ts.value;
                return (
                  <StaggerItem key={ts.value}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                      onClick={() => {
                        setTargetScope(ts.value);
                        if (ts.value === 'all') setTargetValue('');
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                        selected
                          ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--accent))]/40'
                      }`}
                    >
                      <p className="font-medium text-sm text-[hsl(var(--foreground))]">
                        {ts.label}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {ts.description}
                      </p>
                    </motion.button>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <AnimatePresence>
              {targetScope !== 'all' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={spring}
                >
                  <input
                    type="text"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={targetScope === 'block' ? 'Enter block name (e.g. A, B, C)' : 'Enter floor number (e.g. 1, 2, 3)'}
                    className="w-full mt-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Active Alerts */}
        <Reveal>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
                Active Alerts
              </h3>
              {activeAlerts.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold breathe-glow">
                  {activeAlerts.length} active
                </span>
              )}
            </div>

            {activeAlerts.length === 0 ? (
              <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring}
                  className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3"
                >
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </motion.div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  No active alerts. All clear!
                </p>
              </div>
            ) : (
              <StaggerContainer className="space-y-3">
                <AnimatePresence>
                  {activeAlerts.map((alert) => {
                    const { color, label, Icon } = alertTypeBadge(alert.type);
                    return (
                      <StaggerItem key={alert.id}>
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={spring}
                          className="card-glow card-shine rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex items-center gap-4"
                        >
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                            alert.severity === 'critical'
                              ? 'bg-red-500/10'
                              : alert.severity === 'high'
                              ? 'bg-orange-500/10'
                              : 'bg-[hsl(var(--muted))]'
                          }`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-[hsl(var(--foreground))] truncate">
                                {alert.title}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${severityBadge(alert.severity)}`}>
                                {alert.severity.toUpperCase()}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[10px] font-medium">
                                {label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                {formatTime(alert.createdAt)}
                              </span>
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                Target: {alert.target}
                              </span>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            onClick={() => handleResolveAlert(alert.id)}
                            className="flex-shrink-0 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            Resolve
                          </motion.button>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </AnimatePresence>
              </StaggerContainer>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
