import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@hooks/usePageTitle';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import {
  Star,
  UtensilsCrossed,
  Sparkles,
  Wrench,
  Shirt,
  Shield,
  Send,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

interface FeedbackCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface FeedbackItem {
  _id: string;
  category: string;
  rating: number;
  comment: string;
  anonymous: boolean;
  status: 'PENDING' | 'REVIEWED' | 'ACTIONED';
  createdAt: string;
  wardenResponse?: string;
}

interface CategoryAverage {
  category: string;
  average: number;
  count: number;
}

const CATEGORIES: FeedbackCategory[] = [
  { key: 'mess_food', label: 'Mess Food', icon: <UtensilsCrossed className="h-5 w-5" /> },
  { key: 'room_cleanliness', label: 'Room Cleanliness', icon: <Sparkles className="h-5 w-5" /> },
  { key: 'maintenance_response', label: 'Maintenance Response', icon: <Wrench className="h-5 w-5" /> },
  { key: 'laundry_service', label: 'Laundry Service', icon: <Shirt className="h-5 w-5" /> },
  { key: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
  { key: 'overall_experience', label: 'Overall Experience', icon: <Star className="h-5 w-5" /> },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: <Clock className="h-3 w-3" />,
  },
  REVIEWED: {
    label: 'Reviewed',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  ACTIONED: {
    label: 'Actioned',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-6 w-6';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hover || value);
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            whileHover={readonly ? {} : { scale: 1.2 }}
            whileTap={readonly ? {} : { scale: 0.85 }}
            animate={!readonly && star === value ? { scale: [1, 1.3, 1] } : {}}
            transition={spring}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => onChange?.(star)}
          >
            <Star
              className={`${sizeClass} transition-colors ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300 dark:text-gray-600'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

export default function FeedbackPage() {
  usePageTitle('Feedback');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [averages, setAverages] = useState<CategoryAverage[]>([]);

  const fetchMyFeedback = useCallback(async () => {
    try {
      const res = await apiFetch<FeedbackItem[]>('/assistant/feedback/my');
      setMyFeedback(res.data ?? []);
    } catch {
      // silently fail
    }
  }, []);

  const fetchAverages = useCallback(async () => {
    try {
      const res = await apiFetch<CategoryAverage[]>('/assistant/feedback/averages');
      setAverages(res.data ?? []);
    } catch {
      // use empty
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await apiFetch('/assistant/feedback-categories');
      } catch {
        // use mock fallback - CATEGORIES constant is used
      }
      await Promise.all([fetchMyFeedback(), fetchAverages()]);
      setLoading(false);
    };
    init();
  }, [fetchMyFeedback, fetchAverages]);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      showError('Please select a category');
      return;
    }
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/assistant/feedback', {
        method: 'POST',
        body: JSON.stringify({
          category: selectedCategory,
          rating,
          comment,
          anonymous,
        }),
      });
      showSuccess('Feedback submitted successfully!');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2000);
      setSelectedCategory(null);
      setRating(0);
      setComment('');
      setAnonymous(false);
      fetchMyFeedback();
      fetchAverages();
    } catch {
      showError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key;
  const getCategoryIcon = (key: string) => CATEGORIES.find((c) => c.key === key)?.icon ?? <Star className="h-4 w-4" />;

  if (loading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Feedback & Ratings"
        subtitle="Share your experience and help us improve"
      />

      {/* Category Selection */}
      <Reveal>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">Select a Category</h3>
          <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <StaggerItem key={cat.key}>
                <motion.button
                  className={`flex w-full flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                    selectedCategory === cat.key
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 ring-1 ring-[hsl(var(--primary))]'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      selectedCategory === cat.key
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {cat.icon}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      selectedCategory === cat.key
                        ? 'text-[hsl(var(--primary))]'
                        : 'text-[hsl(var(--foreground))]'
                    }`}
                  >
                    {cat.label}
                  </span>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Reveal>

      {/* Rating & Comment Form */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <Reveal>
              <div className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-5">
                {/* Star Rating */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
                    Your Rating
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-[hsl(var(--muted-foreground))]"
                    >
                      {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][rating]}
                    </motion.p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
                    Comments <span className="text-[hsl(var(--muted-foreground))]">(optional)</span>
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    rows={3}
                    placeholder="Tell us more about your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {anonymous ? (
                      <EyeOff className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    )}
                    <span className="text-sm text-[hsl(var(--foreground))]">Submit anonymously</span>
                  </div>
                  <motion.button
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      anonymous
                        ? 'bg-[hsl(var(--primary))]'
                        : 'bg-[hsl(var(--muted))]'
                    }`}
                    onClick={() => setAnonymous(!anonymous)}
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                  >
                    <motion.div
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                      animate={{ left: anonymous ? '22px' : '2px' }}
                      transition={spring}
                    />
                  </motion.button>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <motion.button
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
                      submitSuccess
                        ? 'bg-emerald-600 dark:bg-emerald-700'
                        : 'bg-[hsl(var(--primary))]'
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                    disabled={submitting || rating === 0}
                    onClick={handleSubmit}
                  >
                    {submitting ? (
                      <motion.div
                        className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : submitSuccess ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Feedback'}
                  </motion.button>
                </div>
              </div>
            </Reveal>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Average Ratings */}
      {averages.length > 0 && (
        <Reveal>
          <div className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Average Ratings</h3>
            </div>
            <div className="space-y-3">
              {averages.map((avg) => (
                <div key={avg.category} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {getCategoryIcon(avg.category)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-[hsl(var(--foreground))]">
                        {getCategoryLabel(avg.category)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                          {avg.average.toFixed(1)}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          (<AnimatedCounter value={avg.count} />)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <motion.div
                        className="h-full rounded-full bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(avg.average / 5) * 100}%` }}
                        transition={{ ...spring, delay: 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Past Feedback */}
      <Reveal>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Your Recent Feedback</h3>
          </div>

          {myFeedback.length === 0 ? (
            <div className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                No feedback submitted yet. Share your experience above!
              </p>
            </div>
          ) : (
            <StaggerContainer className="space-y-3">
              <AnimatePresence mode="popLayout">
                {myFeedback.map((fb) => {
                  const status = statusConfig[fb.status] ?? statusConfig.PENDING;
                  return (
                    <StaggerItem key={fb._id}>
                      <motion.div
                        layout
                        className="card-glow accent-line rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
                        whileHover={{ y: -1 }}
                        transition={spring}
                      >
                        <div
                          className="flex cursor-pointer items-start justify-between gap-3"
                          onClick={() =>
                            setExpandedFeedback(expandedFeedback === fb._id ? null : fb._id)
                          }
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                                {getCategoryIcon(fb.category)}
                              </span>
                              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                {getCategoryLabel(fb.category)}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}>
                                {status.icon}
                                {status.label}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3">
                              <StarRating value={fb.rating} readonly size="sm" />
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                {new Date(fb.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {fb.comment && (
                              <p className="mt-1.5 line-clamp-1 text-xs text-[hsl(var(--muted-foreground))]">
                                {fb.comment}
                              </p>
                            )}
                          </div>
                          <motion.div
                            animate={{ rotate: expandedFeedback === fb._id ? 180 : 0 }}
                            transition={spring}
                          >
                            <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          </motion.div>
                        </div>

                        <AnimatePresence>
                          {expandedFeedback === fb._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={spring}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-2 border-t border-[hsl(var(--border))] pt-3">
                                {fb.comment && (
                                  <div>
                                    <p className="text-xs font-medium text-[hsl(var(--foreground))]">Your Comment</p>
                                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                                      {fb.comment}
                                    </p>
                                  </div>
                                )}
                                {fb.anonymous && (
                                  <p className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                                    <EyeOff className="h-3 w-3" />
                                    Submitted anonymously
                                  </p>
                                )}
                                {fb.wardenResponse && (
                                  <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                                    <p className="text-xs font-medium text-[hsl(var(--foreground))]">
                                      Warden Response
                                    </p>
                                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                                      {fb.wardenResponse}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
  );
}
