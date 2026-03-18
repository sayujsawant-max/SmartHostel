import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type ErrorVariant = 'inline' | 'block';

interface ErrorBannerProps {
  /** Error message text or node */
  message: ReactNode;
  /** Optional retry callback — renders a retry button when provided */
  onRetry?: () => void;
  /** "inline" for a compact banner, "block" for a centered full-width block (default "inline") */
  variant?: ErrorVariant;
  className?: string;
}

/**
 * Reusable error display.
 *
 * - `inline` — compact red banner with icon, message, and optional retry (good for cards/sections)
 * - `block` — centered layout with large icon for page-level errors
 */
export default function ErrorBanner({
  message,
  onRetry,
  variant = 'inline',
  className = '',
}: ErrorBannerProps) {
  if (variant === 'block') {
    return (
      <div className={`py-16 text-center ${className}`}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-[hsl(var(--foreground))] font-medium mb-1">
          Something went wrong
        </p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800/40 dark:text-red-300 text-sm ${className}`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-medium underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
