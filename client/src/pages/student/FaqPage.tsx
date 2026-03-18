import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const ACTION_LINKS: Record<string, { label: string; to: string }> = {
  leave: { label: 'Request Leave', to: '/student/actions' },
  complaint: { label: 'Report Issue', to: '/student/actions/report-issue' },
  fee: { label: 'View Fee Status', to: '/student/status' },
  qr: { label: 'Show QR Code', to: '/student/actions/show-qr' },
};

function getActionLink(answer: string): { label: string; to: string } | null {
  const lower = answer.toLowerCase();
  if (lower.includes('leave') || lower.includes('outing')) return ACTION_LINKS.leave;
  if (lower.includes('complaint') || lower.includes('issue') || lower.includes('maintenance')) return ACTION_LINKS.complaint;
  if (lower.includes('fee') || lower.includes('payment')) return ACTION_LINKS.fee;
  if (lower.includes('qr') || lower.includes('gate pass')) return ACTION_LINKS.qr;
  return null;
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
        <PageHeader title="FAQ" description="Search frequently asked questions." />
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
          const accordionItems: AccordionItem[] = items.map((faq) => {
            const actionLink = getActionLink(faq.answer);
            return {
              id: faq._id,
              title: faq.question,
              content: (
                <div className="space-y-2">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{faq.answer}</p>
                  {actionLink && (
                    <Link
                      to={actionLink.to}
                      className="inline-block text-xs font-medium text-[hsl(var(--accent))] hover:underline"
                    >
                      {actionLink.label} &rarr;
                    </Link>
                  )}
                </div>
              ),
            };
          });

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
