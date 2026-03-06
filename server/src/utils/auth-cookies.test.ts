import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { setAuthCookies, clearAuthCookies } from './auth-cookies.js';
import { generateTokens, hashJti } from '@services/auth.service.js';
import { createHash } from 'node:crypto';

// Mock response object
function createMockResponse() {
  const cookies: Record<string, { value: string; options: Record<string, unknown> }> = {};
  const cleared: Record<string, Record<string, unknown>> = {};

  return {
    cookie: vi.fn((name: string, value: string, options: Record<string, unknown>) => {
      cookies[name] = { value, options };
    }),
    clearCookie: vi.fn((name: string, options: Record<string, unknown>) => {
      cleared[name] = options;
    }),
    _cookies: cookies,
    _cleared: cleared,
  };
}

describe('setAuthCookies', () => {
  it('sets both cookies with correct options', () => {
    const res = createMockResponse();
    const tokens = { accessToken: 'access-123', refreshToken: 'refresh-456' };

    setAuthCookies(res as never, tokens);

    expect(res.cookie).toHaveBeenCalledTimes(2);

    // Access token cookie
    const accessCall = res._cookies['accessToken'];
    expect(accessCall).toBeDefined();
    expect(accessCall.value).toBe('access-123');
    expect(accessCall.options.httpOnly).toBe(true);
    expect(accessCall.options.sameSite).toBe('lax');
    expect(accessCall.options.path).toBe('/');
    expect(typeof accessCall.options.maxAge).toBe('number');

    // Refresh token cookie
    const refreshCall = res._cookies['refreshToken'];
    expect(refreshCall).toBeDefined();
    expect(refreshCall.value).toBe('refresh-456');
    expect(refreshCall.options.httpOnly).toBe(true);
    expect(refreshCall.options.sameSite).toBe('lax');
    expect(refreshCall.options.path).toBe('/api/auth/refresh');
    expect(typeof refreshCall.options.maxAge).toBe('number');
  });
});

describe('clearAuthCookies', () => {
  it('clears both cookies with matching path options', () => {
    const res = createMockResponse();

    clearAuthCookies(res as never);

    expect(res.clearCookie).toHaveBeenCalledTimes(2);

    const accessCleared = res._cleared['accessToken'];
    expect(accessCleared).toBeDefined();
    expect(accessCleared.httpOnly).toBe(true);
    expect(accessCleared.path).toBe('/');

    const refreshCleared = res._cleared['refreshToken'];
    expect(refreshCleared).toBeDefined();
    expect(refreshCleared.httpOnly).toBe(true);
    expect(refreshCleared.path).toBe('/api/auth/refresh');
  });
});

describe('generateTokens', () => {
  it('returns valid JWT access token containing userId and role claims', () => {
    const { accessToken } = generateTokens('user-123', 'STUDENT');
    const decoded = jwt.decode(accessToken) as Record<string, unknown>;
    expect(decoded.userId).toBe('user-123');
    expect(decoded.role).toBe('STUDENT');
  });

  it('returns valid JWT refresh token containing userId and jti claims', () => {
    const { refreshToken, jti } = generateTokens('user-123', 'STUDENT');
    const decoded = jwt.decode(refreshToken) as Record<string, unknown>;
    expect(decoded.userId).toBe('user-123');
    expect(decoded.jti).toBe(jti);
  });
});

describe('hashJti', () => {
  it('produces consistent SHA-256 hex digest', () => {
    const jti = 'test-jti-value';
    const expected = createHash('sha256').update(jti).digest('hex');
    expect(hashJti(jti)).toBe(expected);
    // Consistent across calls
    expect(hashJti(jti)).toBe(expected);
  });
});
