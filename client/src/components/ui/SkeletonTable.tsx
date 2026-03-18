import { Skeleton } from '@components/Skeleton';

interface SkeletonTableProps {
  /** Number of columns (default 5) */
  cols?: number;
  /** Number of rows (default 5) */
  rows?: number;
  className?: string;
}

/**
 * Table-shaped loading skeleton with header row and body rows.
 */
export default function SkeletonTable({
  cols = 5,
  rows = 5,
  className = '',
}: SkeletonTableProps) {
  return (
    <div
      className={`rounded-2xl border border-[hsl(var(--border))] overflow-hidden ${className}`}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-[hsl(var(--border))] last:border-0"
            >
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <Skeleton className="h-3 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
