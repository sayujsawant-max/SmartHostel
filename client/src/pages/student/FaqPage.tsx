import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import Accordion, { type AccordionItem } from '@components/ui/Accordion';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import {
  Search,
  AlertCircle,
  CreditCard,
  QrCode,
  HelpCircle,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { usePageTitle } from '@hooks/usePageTitle';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

const ACTION_LINKS: Record<string, { label: string; to: string }> = {
  leave: { label: 'Request Leave', to: '/student/actions' },
  complaint: { label: 'Report Issue', to: '/student/actions/report-issue' },
  fee: { label: 'View Fee Status', to: '/student/status' },
  qr: { label: 'Show QR Code', to: '/student/actions/show-qr' },
};

// Category styling config
const CATEGORY_STYLES: Record<string, {
  icon: typeof AlertCircle;
  bg: string;
  text: string;
  cardBg: string;
  border: string;
  headerBg: string;
}> = {
  'Complaints & Maintenance': {
    icon: AlertCircle,
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    cardBg: 'bg-rose-50/60 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800/40',
    headerBg: 'bg-rose-50 dark:bg-rose-950/20',
  },
  'Fees & Payments': {
    icon: CreditCard,
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    cardBg: 'bg-blue-50/60 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    headerBg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  'Gate Pass & Leaves': {
    icon: QrCode,
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    cardBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
};

const DEFAULT_STYLE = {
  icon: HelpCircle,
  bg: 'bg-violet-100 dark:bg-violet-950/40',
  text: 'text-violet-600 dark:text-violet-400',
  cardBg: 'bg-violet-50/60 dark:bg-violet-950/20',
  border: 'border-violet-200 dark:border-violet-800/40',
  headerBg: 'bg-violet-50 dark:bg-violet-950/20',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}

function getActionLink(answer: string): { label: string; to: string } | null {
  const lower = answer.toLowerCase();
  if (lower.includes('leave') || lower.includes('outing')) return ACTION_LINKS.leave;
  if (lower.includes('complaint') || lower.includes('issue') || lower.includes('maintenance')) return ACTION_LINKS.complaint;
  if (lower.includes('fee') || lower.includes('payment')) return ACTION_LINKS.fee;
  if (lower.includes('qr') || lower.includes('gate pass')) return ACTION_LINKS.qr;
  return null;
}

export default function FaqPage() {
  usePageTitle('Faq');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    apiFetch<{ faqs: FaqItem[] }>('/assistant/faq')
      .then((res) => setFaqs(res.data.faqs))
      .catch((err: unknown) => showError(err, 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(faqs, {
        keys: ['question', 'answer', 'keywords'],
        threshold: 0.4,
        includeScore: true,
      }),
    [faqs],
  );

  const results = query.trim()
    ? fuse.search(query).map((r) => r.item)
    : faqs;

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const faq of results) {
      const list = map.get(faq.category) ?? [];
      list.push(faq);
      map.set(faq.category, list);
    }
    return map;
  }, [results]);

  const categories = Array.from(grouped.entries());

  const scrollToCategory = (category: string) => {
    const el = categoryRefs.current.get(category);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.4 }}>
          <PageHeader title="Frequently Asked Questions" description="Find answers to common questions about hostel services" />
        </motion.div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader
          title="Frequently Asked Questions"
          description="Find answers to common questions about hostel services"
        />
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`relative rounded-2xl border bg-[hsl(var(--card))] transition-all duration-200 card-glow ${
          searchFocused
            ? 'border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm dark:border-indigo-500 dark:ring-indigo-500/20'
            : 'border-[hsl(var(--border))]'
        }`}
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <motion.div
            animate={{ scale: searchFocused ? 1.1 : 1, rotate: searchFocused ? -10 : 0 }}
            transition={spring}
          >
            <Search className={`w-5 h-5 transition-colors duration-200 ${
              searchFocused ? 'text-indigo-500' : 'text-[hsl(var(--muted-foreground))]'
            }`} />
          </motion.div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search for answers..."
            className="flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={spring}
                onClick={() => setQuery('')}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-2 py-1 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              >
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Category Summary Cards */}
      {!query.trim() && categories.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {categories.map(([category, items], i) => {
            const style = getCategoryStyle(category);
            const Icon = style.icon;
            return (
              <motion.button
                key={category}
                initial={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.4, delay: 0.12 + 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => scrollToCategory(category)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${style.border} ${style.cardBg} transition-shadow duration-200 hover:shadow-md`}
              >
                <motion.div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}
                  whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="text-center">
                  <p className={`text-xl font-bold ${style.text} leading-tight`}>
                    <AnimatedCounter to={items.length} duration={0.8} />
                  </p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight mt-0.5 line-clamp-1">{category}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* FAQ Content */}
      <AnimatePresence mode="wait">
        {results.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              variant="compact"
              title="No matching answer found"
              description="Try rephrasing or contact your warden."
            />
          </motion.div>
        ) : (
          <motion.div
            key={query || 'all'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {categories.map(([category, items], catIdx) => {
              const style = getCategoryStyle(category);
              const Icon = style.icon;
              const accordionItems: AccordionItem[] = items.map((faq) => {
                const actionLink = getActionLink(faq.answer);
                return {
                  id: faq._id,
                  title: faq.question,
                  content: (
                    <div className="space-y-2">
                      <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{faq.answer}</p>
                      {actionLink && (
                        <Link
                          to={actionLink.to}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {actionLink.label} &rarr;
                        </Link>
                      )}
                    </div>
                  ),
                };
              });

              return (
                <motion.div
                  key={category}
                  ref={(el) => {
                    if (el) categoryRefs.current.set(category, el);
                  }}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.4, delay: 0.06 * catIdx, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-2.5"
                >
                  {/* Category Header */}
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={spring}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border ${style.border} ${style.headerBg}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{category}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{items.length} questions</p>
                    </div>
                  </motion.div>

                  {/* FAQ Accordion */}
                  <Accordion
                    items={accordionItems}
                    openId={openId}
                    onToggle={setOpenId}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
