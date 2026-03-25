interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg skeleton-premium ${className}`}
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

/* ─── Page-Specific Skeletons ─────────────────────────────────── */

/** Student Dashboard: hero + 4 stats + quick actions + list */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Hero card */}
      <Skeleton className="h-32 w-full rounded-2xl" />
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <Skeleton className="w-9 h-9 rounded-lg mb-2" />
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Quick Actions */}
      <Skeleton className="h-5 w-28" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* List items */}
      <Skeleton className="h-5 w-36" />
      {[...Array(3)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Mess Menu: header + 2×2 meal cards + day tabs + weekly list */
export function MenuSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Weekly section */}
      <Skeleton className="h-5 w-32 mt-2" />
      <div className="flex gap-1.5">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-14 rounded-xl" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Laundry: stats + date picker + machine chips + slot rows */
export function LaundrySkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
      {/* Date picker */}
      <div className="flex gap-1.5">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-14 rounded-xl" />
        ))}
      </div>
      {/* Machine chips */}
      <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <Skeleton className="h-4 w-36 mb-3" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Slot rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-16 space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-2 w-16" />
            </div>
            <div className="flex-1 grid grid-cols-5 gap-1.5">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** FAQ: search bar + category cards + accordion items */
export function FaqSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Search bar */}
      <Skeleton className="h-12 w-full rounded-2xl" />
      {/* Category summary cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
      {/* Category sections */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-2.5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {[...Array(3)].map((_, j) => (
            <Skeleton key={j} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Warden Dashboard: 4 stat cards + alert sections + analytics */
export function WardenDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="w-11 h-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      {/* Attention cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      {/* Analytics */}
      <Skeleton className="h-5 w-28" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center">
            <Skeleton className="w-20 h-20 rounded-full mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <Skeleton className="h-4 w-40 mb-3" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 mb-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Activity feed */}
      <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <Skeleton className="h-5 w-36 mb-3" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2 mb-1">
            <Skeleton className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
            <Skeleton className="h-2 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Maintenance Tasks: 3 stats + task cards */
export function TasksSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Actions page: 2-column grid of action cards */
export function ActionsSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="text-center space-y-1">
              <Skeleton className="h-3 w-20 mx-auto" />
              <Skeleton className="h-2 w-28 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
