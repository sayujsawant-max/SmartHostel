import type { ReactNode } from 'react';

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

export type StatusVariant = keyof typeof VARIANT_CLASSES;

interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusVariant;
  /** Override with a custom className instead of a preset variant */
  className?: string;
}

/**
 * Pill-shaped status badge matching the existing pattern used
 * across complaints, visitors, notices, rooms, and lost-found pages.
 */
export default function StatusBadge({
  children,
  variant = 'neutral',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className ?? VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}

export { VARIANT_CLASSES };
