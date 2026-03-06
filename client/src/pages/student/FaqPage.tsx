import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { apiFetch } from '@services/api';

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
    return <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">FAQ</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Search frequently asked questions.</p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search FAQs..."
        className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
      />

      {results.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[hsl(var(--muted-foreground))]">No matching answer found. Try rephrasing or contact your warden.</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category} className="space-y-1">
            <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{category}</h3>
            <div className="space-y-1">
              {items.map((faq) => {
                const isOpen = openId === faq._id;
                const actionLink = getActionLink(faq.answer);
                return (
                  <div key={faq._id} className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq._id)}
                      className="w-full text-left p-3 flex justify-between items-center"
                    >
                      <span className="text-sm font-medium text-[hsl(var(--foreground))] pr-2">{faq.question}</span>
                      <svg
                        className={`w-4 h-4 flex-shrink-0 text-[hsl(var(--muted-foreground))] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{faq.answer}</p>
                        {actionLink && (
                          <Link
                            to={actionLink.to}
                            className="inline-block text-xs text-blue-600 hover:underline"
                          >
                            {actionLink.label} &rarr;
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
