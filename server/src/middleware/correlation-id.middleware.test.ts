import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { correlationIdMiddleware } from './correlation-id.middleware.js';

function makeMockReq(headers: Record<string, string> = {}): Request {
  return {
    headers,
  } as unknown as Request;
}

function makeMockRes(): Response & { _headers: Record<string, string> } {
  const res = {
    _headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      res._headers[name] = value;
    },
  } as unknown as Response & { _headers: Record<string, string> };
  return res;
}

describe('correlationIdMiddleware', () => {
  it('adds X-Correlation-Id header to response when none provided in request', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(res._headers['X-Correlation-Id']).toBeDefined();
    expect(typeof res._headers['X-Correlation-Id']).toBe('string');
    expect(res._headers['X-Correlation-Id'].length).toBeGreaterThan(0);
    expect(next).toHaveBeenCalled();
  });

  it('uses existing X-Correlation-Id from request headers', () => {
    const existingId = 'my-custom-correlation-id-123';
    const req = makeMockReq({ 'x-correlation-id': existingId });
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(res._headers['X-Correlation-Id']).toBe(existingId);
    expect(next).toHaveBeenCalled();
  });

  it('sets correlationId on req object', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(req.correlationId.length).toBeGreaterThan(0);
  });

  it('sets same correlationId on both req and response header', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe(res._headers['X-Correlation-Id']);
  });

  it('preserves incoming correlation id on req object', () => {
    const existingId = 'trace-abc-456';
    const req = makeMockReq({ 'x-correlation-id': existingId });
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe(existingId);
  });

  it('generates a UUID-format id when none provided', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(req.correlationId).toMatch(uuidRegex);
  });

  it('calls next() exactly once', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next: NextFunction = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
