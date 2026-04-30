import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Auth rate limiter: limits login/register/refresh attempts per IP.
 * - Login: 10 attempts per 15-minute window
 * - Register: 5 attempts per 15-minute window
 * - Refresh: 30 attempts per 15-minute window (more lenient, auto-triggered)
 * Disabled in test environment to avoid interfering with test suites.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.E2E_BYPASS_RATE_LIMIT === 'true',
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? '0.0.0.0'),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts — try again later',
      },
    });
  },
});

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.E2E_BYPASS_RATE_LIMIT === 'true',
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? '0.0.0.0'),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many registration attempts — try again later',
      },
    });
  },
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.E2E_BYPASS_RATE_LIMIT === 'true',
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? '0.0.0.0'),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many refresh attempts — try again later',
      },
    });
  },
});
