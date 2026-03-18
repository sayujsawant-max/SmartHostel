import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { MotionCard } from '@/components/motion/MotionCard';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import Spinner from '@components/ui/Spinner';
import { motion, AnimatePresence } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

const CATEGORIES = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'GENERAL', label: 'General' },
];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError('Please select a category');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify({ category, description: description.trim() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint');
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
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">Issue Reported Successfully</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Your complaint has been logged and assigned an SLA deadline.</p>
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
        <PageHeader title="Report an Issue" description="Select the category that best matches your issue." />
      </Reveal>

      <Reveal direction="none" delay={0.1}>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{description.length}/1000</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                key="report-error"
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
            className="w-full py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {submitting && <Spinner size="h-4 w-4" />}
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </Reveal>
    </div>
  );
}
