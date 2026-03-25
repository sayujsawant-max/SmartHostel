import { toast } from 'sonner';
import { ApiError } from '@services/api';

/**
 * Extract a human-readable message from any error.
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

/**
 * Show a toast for a caught error. Deduplicates by message.
 */
export function showError(err: unknown, fallback?: string) {
  const msg = fallback ?? getErrorMessage(err);
  toast.error(msg);
}

/**
 * Show a success toast.
 */
export function showSuccess(msg: string) {
  toast.success(msg);
}

/**
 * Show a loading toast that can be resolved or rejected.
 * Returns a promise-based toast ID for updating.
 *
 * Usage:
 *   const id = showLoading('Booking slot...');
 *   try { await action(); toast.success('Booked!', { id }); }
 *   catch (e) { toast.error(getErrorMessage(e), { id }); }
 */
export function showLoading(msg: string) {
  return toast.loading(msg);
}

export { toast };
