interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[hsl(var(--muted))] ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function StatSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-8 w-2/3" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <div className="space-y-3 mt-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
