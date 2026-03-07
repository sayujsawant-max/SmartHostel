import type { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips keys starting with '$' from an object in-place
 * to prevent MongoDB operator injection ($gt, $ne, $where, etc.).
 */
function sanitizeInPlace(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitizeInPlace(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          sanitizeInPlace(item as Record<string, unknown>);
        }
      }
    }
  }
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * by stripping any keys that start with '$'.
 */
export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    sanitizeInPlace(req.body as Record<string, unknown>);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeInPlace(req.query as Record<string, unknown>);
  }
  next();
}
