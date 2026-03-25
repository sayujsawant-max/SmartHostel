import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { MotionCard } from '@/components/motion/MotionCard';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import Spinner from '@components/ui/Spinner';
import { motion, AnimatePresence } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

const LEAVE_TYPES = [
  { value: 'DAY_OUTING', label: 'Day Outing' },
  { value: 'OVERNIGHT', label: 'Overnight' },
];

function toISOWithOffset(dateStr: string): string {
  const date = new Date(dateStr);
  const offsetMs = date.getTimezoneOffset() * -60_000;
  const sign = offsetMs >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMs);
  const hours = String(Math.floor(absOffset / 3_600_000)).padStart(2, '0');
  const minutes = String(Math.floor((absOffset % 3_600_000) / 60_000)).padStart(2, '0');
  return `${dateStr}T00:00:00.000${sign}${hours}:${minutes}`;
}

const inputCls = 'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

export default function RequestLeavePage() {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!type) {
      setError('Please select a leave type');
      return;
    }
    if (!startDate) {
      setError('Please select a start date');
      return;
    }
    if (!endDate) {
      setError('Please select an end date');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/leaves', {
        method: 'POST',
        body: JSON.stringify({
          type,
          startDate: toISOWithOffset(startDate),
          endDate: toISOWithOffset(endDate),
          reason: reason.trim(),
        }),
      });
      setSuccess(true);
      showSuccess('Leave request submitted successfully');
      void import('@/utils/confetti').then(m => m.celebrateMini());
    } catch (err) {
      showError(err, 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const reduced = prefersReducedMotion();
    const Wrapper = reduced ? 'div' : motion.div;
    const wrapperProps = reduced
      ? {}
      : {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: 'spring' as const },
        };

    return (
      <Wrapper {...wrapperProps} className="space-y-4">
        <MotionCard>
          <div className="p-6 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">Leave Request Submitted</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Your request is pending warden approval.</p>
            <button
              onClick={() => navigate('/student/status')}
              className="mt-4 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Status
            </button>
          </div>
        </MotionCard>
      </Wrapper>
    );
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader title="Request Leave" description="Apply for a day outing or overnight leave." />
      </Reveal>

      <Reveal direction="none" delay={0.1}>
      <form onSubmit={(e) => void handleSubmit(e)} className="relative overflow-hidden space-y-4 p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-glow">
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Leave Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputCls}
          >
            <option value="">Select type...</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate(e.target.value);
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Why do you need leave?"
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{reason.length}/500</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="leave-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
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
          {submitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
      </Reveal>
    </div>
  );
}
