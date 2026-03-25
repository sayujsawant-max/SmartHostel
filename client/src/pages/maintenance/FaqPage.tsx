import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import Accordion, { type AccordionItem } from '@components/ui/Accordion';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { Search, Wrench, HelpCircle } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

const CATEGORY_STYLES: Record<string, { icon: typeof Wrench; bg: string; text: string; headerBg: string; border: string }> = {
  'Procedures': {
    icon: Wrench,
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    headerBg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/40',
  },
};

const DEFAULT_STYLE = {
  icon: HelpCircle,
  bg: 'bg-slate-100 dark:bg-slate-950/40',
  text: 'text-slate-600 dark:text-slate-400',
  headerBg: 'bg-slate-50 dark:bg-slate-950/20',
  border: 'border-slate-200 dark:border-slate-800/40',
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
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

  if (loading) {
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.4 }}>
          <PageHeader title="FAQ" description="Common questions for maintenance staff." />
        </motion.div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader title="FAQ" description="Common questions for maintenance staff." />
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`relative rounded-2xl border bg-[hsl(var(--card))] transition-all duration-200 card-glow ${
          searchFocused
            ? 'border-orange-400 ring-2 ring-orange-400/20 shadow-sm dark:border-orange-500 dark:ring-orange-500/20'
            : 'border-[hsl(var(--border))]'
        }`}
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <motion.div
            animate={{ scale: searchFocused ? 1.1 : 1, rotate: searchFocused ? -10 : 0 }}
            transition={spring}
          >
            <Search className={`w-5 h-5 transition-colors duration-200 ${
              searchFocused ? 'text-orange-500' : 'text-[hsl(var(--muted-foreground))]'
            }`} />
          </motion.div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search FAQs..."
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

      {/* FAQ Content */}
      <AnimatePresence mode="wait">
        {results.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
              const accordionItems: AccordionItem[] = items.map((faq) => ({
                id: faq._id,
                title: faq.question,
                content: (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{faq.answer}</p>
                ),
              }));

              return (
                <motion.div
                  key={category}
                  ref={(el) => {
                    if (el) categoryRefs.current.set(category, el);
                  }}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.4, delay: 0.06 * catIdx }}
                  className="space-y-2.5"
                >
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
