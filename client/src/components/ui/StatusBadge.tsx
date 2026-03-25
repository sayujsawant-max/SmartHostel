import type { ReactNode } from 'react';
import { motion } from 'motion/react';

/**
 * Color presets that match the patterns already used across the app.
 * Maps a semantic intent to Tailwind bg + text classes.
 */
const VARIANT_CLASSES = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  accent: 'bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]',
} as const;

/** Subtle dot color that pulses next to active/warning/error badges */
const DOT_COLORS: Partial<Record<StatusVariant, string>> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

export type StatusVariant = keyof typeof VARIANT_CLASSES;

interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusVariant;
  /** Show a pulsing dot indicator (default: true for success/warning/error) */
  pulse?: boolean;
  /** Override with a custom className instead of a preset variant */
  className?: string;
}

/**
 * Pill-shaped status badge with optional pulsing dot indicator.
 * Used across complaints, visitors, notices, rooms, and lost-found pages.
 */
export default function StatusBadge({
  children,
  variant = 'neutral',
  pulse,
  className,
}: StatusBadgeProps) {
  const dotColor = DOT_COLORS[variant];
  const showDot = pulse ?? !!dotColor;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${className ?? VARIANT_CLASSES[variant]}`}
    >
      {showDot && dotColor && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}
      {children}
    </motion.span>
  );
}

export { VARIANT_CLASSES };
