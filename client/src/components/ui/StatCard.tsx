import type { ReactNode } from 'react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

interface StatCardProps {
  /** Numeric value to display (animated via AnimatedCounter) */
  value: number;
  label: string;
  /** Optional prefix/suffix for the counter (e.g. "+" or "%") */
  prefix?: string;
  suffix?: string;
  /** Highlight the value with accent color */
  accent?: boolean;
  /** Optional icon rendered above the value */
  icon?: ReactNode;
  className?: string;
}

/**
 * Reusable stat card with animated counter.
 *
 * Works for dashboard summaries, availability stats, and hero stat strips.
 * Counter respects reduced-motion preferences (shows final value immediately).
 */
export default function StatCard({
  value,
  label,
  prefix,
  suffix,
  accent = false,
  icon,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`py-4 px-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center shadow-sm ${className}`}
    >
      {icon && (
        <div className="flex justify-center mb-2 text-[hsl(var(--muted-foreground))]">
          {icon}
        </div>
      )}
      <p
        className={`text-2xl font-bold ${
          accent
            ? 'text-[hsl(var(--accent))]'
            : 'text-[hsl(var(--foreground))]'
        }`}
      >
        <AnimatedCounter to={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-medium">
        {label}
      </p>
    </div>
  );
}
