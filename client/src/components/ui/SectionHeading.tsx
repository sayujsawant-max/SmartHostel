import type { ReactNode } from 'react';

type HeadingSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<HeadingSize, string> = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
};

interface SectionHeadingProps {
  /** Small accent label above the title (e.g. "Features") */
  label?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Center-align text (default true) */
  center?: boolean;
  /** Heading size preset (default "lg" for public pages, use "md" for dashboards) */
  size?: HeadingSize;
  /** HTML tag for the title (default "h2") */
  as?: 'h1' | 'h2' | 'h3';
}

/**
 * Reusable section heading with optional accent label, title, and description.
 * Provides consistent typography hierarchy across all pages.
 *
 * - `lg` — public / landing / hero sections
 * - `md` — dashboard section titles
 * - `sm` — card or panel sub-headings
 */
export default function SectionHeading({
  label,
  title,
  description,
  children,
  className = '',
  center = true,
  size = 'lg',
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <div className={`${center ? 'text-center' : ''} ${className}`}>
      {label && (
        <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-3">
          {label}
        </p>
      )}
      <Tag
        className={`${SIZE_CLASSES[size]} font-bold text-[hsl(var(--foreground))] tracking-tight`}
      >
        {title}
      </Tag>
      {description && (
        <p
          className={`mt-3 text-[hsl(var(--muted-foreground))] ${
            size === 'lg' ? 'text-lg max-w-xl' : 'text-sm max-w-md'
          } ${center ? 'mx-auto' : ''}`}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
