// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, ApiError, AUTH_REFRESH_FAILED_EVENT } from './api';

// Track fetch calls
let fetchCalls: { url: string; options: RequestInit }[] = [];
let fetchResponses: { status: number; body: unknown }[] = [];

function mockFetch(responses: { status: number; body: unknown }[]) {
  fetchResponses = [...responses];
  fetchCalls = [];

  globalThis.fetch = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
    const response = fetchResponses.shift();
    if (!response) throw new Error('No more mock responses');

    fetchCalls.push({ url: url.toString(), options: options ?? {} });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body,
    } as Response;
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    fetchCalls = [];
    fetchResponses = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns data on successful response', async () => {
    mockFetch([
      { status: 200, body: { success: true, data: { user: { id: '1' } }, correlationId: 'c1' } },
    ]);

    const result = await apiFetch('/auth/me');
    expect(result.data).toEqual({ user: { id: '1' } });
  });

  it('on 401 response attempts POST /api/auth/refresh before throwing', async () => {
    mockFetch([
      // Original request returns 401
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired', retryable: false }, correlationId: 'c1' } },
      // Refresh attempt succeeds
      { status: 200, body: { success: true, data: {}, correlationId: 'c2' } },
      // Retry of original request succeeds
      { status: 200, body: { success: true, data: { user: { id: '1' } }, correlationId: 'c3' } },
    ]);

    const result = await apiFetch('/auth/me');
    expect(result.data).toEqual({ user: { id: '1' } });

    // Verify refresh was called
    expect(fetchCalls[1].url).toBe('/api/auth/refresh');
    expect(fetchCalls[1].options.method).toBe('POST');
  });

  it('on 401 retries original request after successful refresh', async () => {
    mockFetch([
      // Original GET /auth/me returns 401
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired', retryable: false }, correlationId: 'c1' } },
      // Refresh succeeds
      { status: 200, body: { success: true, data: {}, correlationId: 'c2' } },
      // Retry succeeds
      { status: 200, body: { success: true, data: { items: ['a'] }, correlationId: 'c3' } },
    ]);

    const result = await apiFetch('/some/endpoint');
    expect(result.data).toEqual({ items: ['a'] });
    // 3 fetch calls: original + refresh + retry
    expect(fetchCalls.length).toBe(3);
    expect(fetchCalls[2].url).toBe('/api/some/endpoint');
  });

  it('on 401 where refresh also returns 401 throws ApiError (no infinite loop)', async () => {
    mockFetch([
      // Original returns 401
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired', retryable: false }, correlationId: 'c1' } },
      // Refresh also returns 401
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Refresh failed', retryable: false }, correlationId: 'c2' } },
    ]);

    await expect(apiFetch('/auth/me')).rejects.toThrow(ApiError);
    // Only 2 calls — no infinite loop
    expect(fetchCalls.length).toBe(2);
  });

  it('concurrent 401s result in only one refresh call (deduplication)', async () => {
    let refreshCallCount = 0;
    const callCountByUrl: Record<string, number> = {};

    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr === '/api/auth/refresh') {
        refreshCallCount++;
        // Simulate some async delay so both 401s encounter the same refresh promise
        await new Promise((r) => setTimeout(r, 50));
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: {}, correlationId: 'r1' }),
        } as Response;
      }

      // Track how many times each URL has been called
      callCountByUrl[urlStr] = (callCountByUrl[urlStr] || 0) + 1;

      // First call for each URL returns 401, second call (retry) returns success
      if (callCountByUrl[urlStr] === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'expired', retryable: false },
            correlationId: 'c1',
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { ok: true }, correlationId: 'c2' }),
      } as Response;
    });

    // Fire two concurrent requests that both 401
    const [r1, r2] = await Promise.all([
      apiFetch('/endpoint-a'),
      apiFetch('/endpoint-b'),
    ]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    // Only one refresh call despite two 401s
    expect(refreshCallCount).toBe(1);
  });

  it('failed refresh triggers auth-state-cleared signal', async () => {
    const eventSpy = vi.fn();
    window.addEventListener(AUTH_REFRESH_FAILED_EVENT, eventSpy);

    mockFetch([
      // Original returns 401
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'expired', retryable: false }, correlationId: 'c1' } },
      // Refresh fails
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'invalid', retryable: false }, correlationId: 'c2' } },
    ]);

    await expect(apiFetch('/auth/me')).rejects.toThrow(ApiError);
    expect(eventSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_REFRESH_FAILED_EVENT, eventSpy);
  });

  it('does not attempt refresh for /auth/refresh path itself', async () => {
    mockFetch([
      { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'expired', retryable: false }, correlationId: 'c1' } },
    ]);

    await expect(apiFetch('/auth/refresh', { method: 'POST' })).rejects.toThrow(ApiError);
    // Only 1 call — no refresh attempt
    expect(fetchCalls.length).toBe(1);
  });
});
