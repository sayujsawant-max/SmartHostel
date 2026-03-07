import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { mongoSanitizeMiddleware } from './mongo-sanitize.middleware.js';

function makeMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

describe('mongoSanitizeMiddleware', () => {
  const res = {} as Response;
  const next: NextFunction = vi.fn();

  it('strips $-prefixed keys from body', () => {
    const req = makeMockReq({
      body: { email: 'a@b.com', password: { $gt: '' } },
    });
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body).toEqual({ email: 'a@b.com', password: {} });
    expect(next).toHaveBeenCalled();
  });

  it('strips $-prefixed keys from query', () => {
    const req = makeMockReq({
      query: { status: 'OPEN', role: { $ne: 'ADMIN' } } as unknown as Request['query'],
    });
    mongoSanitizeMiddleware(req, res, next);
    expect(req.query).toEqual({ status: 'OPEN', role: {} });
  });

  it('strips nested $-prefixed keys', () => {
    const req = makeMockReq({
      body: { filter: { age: { $gt: 18, $lt: 65 }, name: 'John' } },
    });
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body).toEqual({ filter: { age: {}, name: 'John' } });
  });

  it('handles arrays correctly', () => {
    const req = makeMockReq({
      body: { items: [{ $where: '1==1' }, { name: 'ok' }] },
    });
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body).toEqual({ items: [{}, { name: 'ok' }] });
  });

  it('passes through clean data unchanged', () => {
    const req = makeMockReq({
      body: { email: 'test@test.com', password: 'secret123' },
    });
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body).toEqual({ email: 'test@test.com', password: 'secret123' });
  });

  it('handles null body gracefully', () => {
    const req = makeMockReq({ body: null });
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body).toBeNull();
    expect(next).toHaveBeenCalled();
  });
});
