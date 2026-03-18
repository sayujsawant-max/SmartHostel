import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Subtitle / description line below the title */
  description?: string;
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
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
