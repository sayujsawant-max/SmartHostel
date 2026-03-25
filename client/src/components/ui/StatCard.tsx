import type { ReactNode } from 'react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import TiltCard from './TiltCard';

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
 * Premium stat card with animated counter, 3D tilt, gradient accent line,
 * and glow border on hover.
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
    <TiltCard maxTilt={10} glare className="rounded-xl">
      <div
        className={`relative py-4 px-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center shadow-sm transition-shadow hover:shadow-md card-glow accent-line ${className}`}
      >
        {/* Top gradient shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/25 to-transparent" />
        {icon && (
          <div className="flex justify-center mb-2 text-[hsl(var(--muted-foreground))]">
            {icon}
          </div>
        )}
        <p
          className={`text-2xl font-bold tabular-nums ${
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
    </TiltCard>
  );
}
