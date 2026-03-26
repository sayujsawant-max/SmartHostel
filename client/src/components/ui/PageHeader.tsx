import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  /** Subtitle / description line below the title */
  description?: string;
  /** Alias for description */
  subtitle?: string;
  /** Optional icon rendered before the title */
  icon?: ReactNode;
  /** Right-aligned action slot (button, link, filter, etc.) */
  action?: ReactNode;
  className?: string;
}

/**
 * Standard page-level header for dashboard and internal pages.
 *
 * Renders a consistent h2 title, optional description, and an
 * optional right-aligned action area. Designed for use inside
 * shell layouts (StudentShell, WardenShell, etc.).
 *
 * ```tsx
 * <PageHeader
 *   title="Complaints"
 *   description="View and manage student complaints"
 *   action={<button>New Complaint</button>}
 * />
 * ```
 */
export default function PageHeader({
  title,
  description,
  subtitle,
  icon,
  action,
  className = '',
}: PageHeaderProps) {
  const desc = description ?? subtitle;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight flex items-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          {title}
        </h2>
        {desc && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {desc}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
