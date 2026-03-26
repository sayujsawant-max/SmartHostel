import type { ReactNode } from 'react';

interface ShimmerTextProps {
  children: ReactNode;
  className?: string;
  /** Use gradient-heading (slow) or text-shimmer (fast) */
  variant?: 'heading' | 'shimmer';
}

/**
 * Text with an animated gradient shimmer effect.
 * Use 'heading' variant for page titles, 'shimmer' for emphasis text.
 */
export function ShimmerText({
  children,
  className = '',
  variant = 'heading',
}: ShimmerTextProps) {
  const cssClass = variant === 'heading' ? 'gradient-heading' : 'text-shimmer';
  return <span className={`${cssClass} ${className}`}>{children}</span>;
}
