import type { Response } from 'express';
import { env } from '@config/env.js';

const isProduction = env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/auth/refresh',
};

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie('accessToken', tokens.accessToken, {
    ...ACCESS_COOKIE_OPTIONS,
    maxAge: env.ACCESS_TOKEN_EXPIRY,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: env.REFRESH_TOKEN_EXPIRY,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', ACCESS_COOKIE_OPTIONS);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
}
