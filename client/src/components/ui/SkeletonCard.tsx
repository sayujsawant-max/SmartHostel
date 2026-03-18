import { Skeleton } from '@components/Skeleton';

interface SkeletonCardProps {
  /** Number of body text lines (default 2) */
  lines?: number;
  className?: string;
}

/**
 * Card-shaped loading skeleton.
 * Wraps the base Skeleton primitive in a standard card shell.
 */
export default function SkeletonCard({ lines = 2, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] ${className}`}
    >
      <Skeleton className="h-4 w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'} ${i < lines - 1 ? 'mb-2' : ''}`}
        />
      ))}
    </div>
  );
}
