import type { ReactNode } from 'react';

type EmptyVariant = 'default' | 'compact' | 'card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /**
   * - `default` — full-size centered block with large padding (page-level)
   * - `compact` — smaller padding, tighter spacing (inline within a section)
   * - `card` — compact with card background and border (inside panels/tables)
   */
  variant?: EmptyVariant;
  className?: string;
}

const DEFAULT_ICON = (
  <svg
    className="w-16 h-16 text-[hsl(var(--muted-foreground)/0.4)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

const COMPACT_ICON = (
  <svg
    className="w-10 h-10 text-[hsl(var(--muted-foreground)/0.35)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

const VARIANT_STYLES: Record<EmptyVariant, { wrapper: string; icon: ReactNode }> = {
  default: {
    wrapper: 'py-16 px-4',
    icon: DEFAULT_ICON,
  },
  compact: {
    wrapper: 'py-8 px-4',
    icon: COMPACT_ICON,
  },
  card: {
    wrapper: 'py-8 px-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]',
    icon: COMPACT_ICON,
  },
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${styles.wrapper} ${className}`}
    >
      <div className="text-[hsl(var(--muted-foreground))] mb-4">
        {icon ?? styles.icon}
      </div>
      <h3
        className={`font-semibold text-[hsl(var(--foreground))] ${
          variant === 'default' ? 'text-lg' : 'text-base'
        }`}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
