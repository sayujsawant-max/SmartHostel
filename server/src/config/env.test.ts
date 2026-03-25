import { describe, it, expect } from 'vitest';
import { env, allowedOrigins } from './env.js';

describe('env config', () => {
  it('exports PORT as a number', () => {
    expect(env.PORT).toBeTypeOf('number');
  });

  it('exports NODE_ENV as a valid environment string', () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
  });

  it('exports JWT_SECRET as a non-empty string', () => {
    expect(env.JWT_SECRET).toBeTypeOf('string');
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('exports MONGODB_URI starting with mongodb://', () => {
    expect(env.MONGODB_URI).toBeTypeOf('string');
    expect(
      env.MONGODB_URI.startsWith('mongodb://') ||
        env.MONGODB_URI.startsWith('mongodb+srv://'),
    ).toBe(true);
  });

  it('exports MAX_LOGIN_ATTEMPTS as a number', () => {
    expect(env.MAX_LOGIN_ATTEMPTS).toBeTypeOf('number');
  });

  it('exports LOGIN_LOCKOUT_DURATION_MS as a number', () => {
    expect(env.LOGIN_LOCKOUT_DURATION_MS).toBeTypeOf('number');
  });

  it('exports ACCESS_TOKEN_EXPIRY as a number (milliseconds)', () => {
    expect(env.ACCESS_TOKEN_EXPIRY).toBeTypeOf('number');
    expect(env.ACCESS_TOKEN_EXPIRY).toBeGreaterThan(0);
  });

  it('exports REFRESH_TOKEN_EXPIRY as a number (milliseconds)', () => {
    expect(env.REFRESH_TOKEN_EXPIRY).toBeTypeOf('number');
    expect(env.REFRESH_TOKEN_EXPIRY).toBeGreaterThan(0);
  });

  it('exports ALLOWED_ORIGINS as a string', () => {
    expect(env.ALLOWED_ORIGINS).toBeTypeOf('string');
  });

  it('exports allowedOrigins as a non-empty array', () => {
    expect(Array.isArray(allowedOrigins)).toBe(true);
    expect(allowedOrigins.length).toBeGreaterThan(0);
  });

  it('exports CRON_ENABLED as a boolean', () => {
    expect(env.CRON_ENABLED).toBeTypeOf('boolean');
  });

  it('exports SMTP_PORT as a number', () => {
    expect(env.SMTP_PORT).toBeTypeOf('number');
  });
});
