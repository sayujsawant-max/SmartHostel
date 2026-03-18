import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import PageHeader from '@components/ui/PageHeader';
import Accordion, { type AccordionItem } from '@components/ui/Accordion';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ faqs: FaqItem[] }>('/assistant/faq')
      .then((res) => setFaqs(res.data.faqs))
      .catch(() => {})
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

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader title="FAQ" description="Common questions for maintenance staff." />
      </Reveal>

      <Reveal direction="none" delay={0.1}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
        />
      </Reveal>

      {results.length === 0 ? (
        <EmptyState
          variant="compact"
          title="No matching answer found"
          description="Try rephrasing or contact your warden."
        />
      ) : (
        Array.from(grouped.entries()).map(([category, items]) => {
          const accordionItems: AccordionItem[] = items.map((faq) => ({
            id: faq._id,
            title: faq.question,
            content: (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{faq.answer}</p>
            ),
          }));

          return (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                {category}
              </h3>
              <Accordion
                items={accordionItems}
                openId={openId}
                onToggle={setOpenId}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
