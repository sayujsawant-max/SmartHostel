import type { Request, Response, NextFunction } from 'express';
import { allowedOrigins } from '@config/env.js';
import { AppError } from '@utils/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function extractOrigin(headerValue: string): string | null {
  try {
    const url = new URL(headerValue);
    return url.origin;
  } catch {
    return null;
  }
}

export function csrfMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Safe methods are exempt from CSRF checks
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // For state-changing methods, validate Origin or Referer
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  let requestOrigin: string | null = null;

  if (origin) {
    // Origin header is preferred — it's already just the origin
    requestOrigin = origin;
  } else if (referer) {
    // Fall back to Referer header — extract origin portion
    requestOrigin = extractOrigin(referer);
  }

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    throw new AppError('FORBIDDEN', 'CSRF validation failed', 403);
  }

  next();
}
