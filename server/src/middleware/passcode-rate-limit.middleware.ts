import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { ScanResult } from '@smarthostel/shared';

/**
 * PassCode-specific rate limiter: 5 attempts per 60s window per guard.
 * Only applies when request body contains passCode (skips QR scans).
 */
export const passCodeRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req: Request) => !req.body?.passCode,
  keyGenerator: (req: Request) => req.user?._id ?? req.ip!,
  handler: (_req: Request, res: Response) => {
    const retryAfterMs = res.getHeader('Retry-After')
      ? Number(res.getHeader('Retry-After')) * 1000
      : 60_000;
    res.status(429).json({
      success: false,
      error: {
        code: ScanResult.RATE_LIMITED,
        message: 'Too many passCode attempts — wait before retrying',
        retryable: true,
        retryAfterMs,
      },
    });
  },
});
