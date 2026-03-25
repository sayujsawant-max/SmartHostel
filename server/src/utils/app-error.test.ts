import { describe, it, expect } from 'vitest';
import { AppError } from './app-error.js';

describe('AppError', () => {
  it('creates error with correct status, code, and message', () => {
    const err = new AppError('NOT_FOUND', 'User not found', 404);

    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('User not found');
    expect(err.statusCode).toBe(404);
  });

  it('is an instance of Error', () => {
    const err = new AppError('INTERNAL_ERROR', 'Something broke', 500);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('sets name to "AppError"', () => {
    const err = new AppError('VALIDATION_ERROR', 'Invalid input', 400);

    expect(err.name).toBe('AppError');
  });

  it('defaults retryable to false when no options provided', () => {
    const err = new AppError('UNAUTHORIZED', 'Not authenticated', 401);

    expect(err.retryable).toBe(false);
  });

  it('sets retryable to true when specified in options', () => {
    const err = new AppError('RATE_LIMITED', 'Too many requests', 429, {
      retryable: true,
    });

    expect(err.retryable).toBe(true);
  });

  it('sets retryAfterMs when specified in options', () => {
    const err = new AppError('RATE_LIMITED', 'Too many requests', 429, {
      retryable: true,
      retryAfterMs: 5000,
    });

    expect(err.retryAfterMs).toBe(5000);
  });

  it('sets field when specified in options', () => {
    const err = new AppError('VALIDATION_ERROR', 'Email is invalid', 400, {
      field: 'email',
    });

    expect(err.field).toBe('email');
  });

  it('leaves retryAfterMs and field undefined when not provided', () => {
    const err = new AppError('FORBIDDEN', 'Access denied', 403);

    expect(err.retryAfterMs).toBeUndefined();
    expect(err.field).toBeUndefined();
  });

  it('has a stack trace', () => {
    const err = new AppError('INTERNAL_ERROR', 'Server error', 500);

    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });

  it('works with all error codes', () => {
    const cases: Array<{ code: string; status: number }> = [
      { code: 'VALIDATION_ERROR', status: 400 },
      { code: 'UNAUTHORIZED', status: 401 },
      { code: 'FORBIDDEN', status: 403 },
      { code: 'NOT_FOUND', status: 404 },
      { code: 'CONFLICT', status: 409 },
      { code: 'RATE_LIMITED', status: 429 },
      { code: 'INTERNAL_ERROR', status: 500 },
    ];

    for (const { code, status } of cases) {
      const err = new AppError(code as any, `Test ${code}`, status);
      expect(err.code).toBe(code);
      expect(err.statusCode).toBe(status);
    }
  });
});
