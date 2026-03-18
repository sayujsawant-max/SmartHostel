import { useId, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { prefersReducedMotion } from '@/utils/motion';

/* ─── Types ─────────────────────────────────────────────────────── */

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Currently open item id (single-open pattern) */
  openId: string | null;
  onToggle: (id: string | null) => void;
  className?: string;
}

/**
 * Accessible single-open accordion.
 *
 * - Proper `<button>` triggers with `aria-expanded` / `aria-controls`
 * - Keyboard support via native button semantics
 * - Reduced-motion: panels appear/disappear instantly (no height animation)
 */
export default function Accordion({
  items,
  openId,
  onToggle,
  className = '',
}: AccordionProps) {
  const baseId = useId();
  const reduced = prefersReducedMotion();

  return (
    <div className={`space-y-1.5 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
          >
            <button
              id={triggerId}
              type="button"
              onClick={() => onToggle(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full text-left p-3 flex justify-between items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] rounded-xl"
            >
              <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                {item.title}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                  style={reduced ? undefined : { overflow: 'hidden' }}
                >
                  <div className="px-3 pb-3">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
