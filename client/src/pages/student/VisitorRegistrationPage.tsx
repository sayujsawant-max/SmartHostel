import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import ErrorBanner from '@components/ui/ErrorBanner';
import Spinner from '@components/ui/Spinner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { usePageTitle } from '@hooks/usePageTitle';

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
  createdAt: string;
}

const RELATIONSHIPS = ['Parent', 'Sibling', 'Friend', 'Guardian', 'Other'];

const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'accent',
  REJECTED: 'error',
  CHECKED_IN: 'info',
  CHECKED_OUT: 'neutral',
  EXPIRED: 'neutral',
};

const inputCls = 'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

export default function VisitorRegistrationPage() {
  usePageTitle('Visitor Registration');
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await apiFetch<VisitorItem[]>('/visitors/my');
      setVisitors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError(err, 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVisitors();
  }, [fetchVisitors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!visitorName.trim()) { setError('Visitor name is required'); return; }
    if (!visitorPhone.trim()) { setError('Visitor phone is required'); return; }
    if (!purpose.trim()) { setError('Purpose is required'); return; }
    if (!expectedDate) { setError('Expected date is required'); return; }

    setSubmitting(true);
    try {
      await apiFetch('/visitors', {
        method: 'POST',
        body: JSON.stringify({
          visitorName: visitorName.trim(),
          visitorPhone: visitorPhone.trim(),
          relationship: relationship || 'Other',
          purpose: purpose.trim(),
          expectedDate,
          expectedTime,
        }),
      });
      showSuccess('Visitor registered successfully');
      setVisitorName('');
      setVisitorPhone('');
      setRelationship('');
      setPurpose('');
      setExpectedDate('');
      setExpectedTime('');
      void fetchVisitors();
    } catch (err) {
      showError(err, 'Failed to register visitor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader title="Visitor Pre-Registration" description="Register a visitor in advance for approval." />
      </Reveal>

      {/* Registration Form */}
      <Reveal direction="none" delay={0.1}>
      <form onSubmit={(e) => void handleSubmit(e)} className="relative overflow-hidden space-y-4 p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Visitor Name</label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Full name"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Phone Number</label>
            <input
              type="tel"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className={inputCls}
            >
              <option value="">Select...</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Expected Time</label>
            <select
              value={expectedTime}
              onChange={(e) => setExpectedTime(e.target.value)}
              className={inputCls}
            >
              <option value="">Select time slot...</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Expected Date</label>
          <input
            type="date"
            value={expectedDate}
            min={today}
            onChange={(e) => setExpectedDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Purpose of Visit</label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Why is the visitor coming?"
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{purpose.length}/300</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div key="visitor-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ErrorBanner message={error} />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {submitting && <Spinner size="h-4 w-4" />}
          {submitting ? 'Registering...' : 'Register Visitor'}
        </button>
      </form>
      </Reveal>

      {/* Visitor List */}
      <div>
        <Reveal delay={0.15}>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">My Visitors</h3>
        </Reveal>
        {loading ? (
          <PageSkeleton />
        ) : visitors.length === 0 ? (
          <EmptyState variant="compact" title="No visitors registered yet" description="Your registered visitors will appear here." />
        ) : (
          <StaggerContainer stagger={0.06} className="space-y-3">
            {visitors.map((v) => (
              <StaggerItem key={v._id}>
              <div className="relative overflow-hidden p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors card-glow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">{v.visitorName}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {v.visitorPhone} &middot; {v.relationship}
                    </p>
                  </div>
                  <StatusBadge variant={STATUS_VARIANT[v.status] ?? 'neutral'}>
                    {v.status.replace(/_/g, ' ')}
                  </StatusBadge>
                </div>
                <p className="text-sm text-[hsl(var(--foreground))]">{v.purpose}</p>
                <div className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap gap-3">
                  <span>Date: {new Date(v.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {v.expectedTime && <span>Time: {v.expectedTime}</span>}
                  {v.checkedInAt && <span>In: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                  {v.checkedOutAt && <span>Out: {new Date(v.checkedOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {v.status === 'REJECTED' && v.rejectionReason && (
                  <p className="text-xs text-red-600 dark:text-red-400">Reason: {v.rejectionReason}</p>
                )}
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
