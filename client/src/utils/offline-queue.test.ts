// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('motion/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: object, prop: string) =>
        React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const { initial, animate, exit, transition, ...rest } = props;
          void initial; void animate; void exit; void transition;
          return React.createElement(prop, { ...rest, ref });
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { OfflineQueue, offlineFetch, syncQueue } from './offline-queue';

const QUEUE_KEY = 'smarthostel-offline-queue';

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    localStorage.clear();
    queue = new OfflineQueue();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    expect(queue.size()).toBe(0);
    expect(queue.getAll()).toEqual([]);
  });

  it('adds items to the queue', () => {
    queue.add({
      id: 'item-1',
      url: '/api/test',
      method: 'POST',
      body: '{"data":1}',
      timestamp: Date.now(),
    });

    expect(queue.size()).toBe(1);
    const items = queue.getAll();
    expect(items[0].id).toBe('item-1');
    expect(items[0].url).toBe('/api/test');
  });

  it('adds multiple items', () => {
    queue.add({ id: '1', url: '/a', method: 'POST', timestamp: 1 });
    queue.add({ id: '2', url: '/b', method: 'PUT', timestamp: 2 });
    queue.add({ id: '3', url: '/c', method: 'DELETE', timestamp: 3 });

    expect(queue.size()).toBe(3);
  });

  it('removes item by id', () => {
    queue.add({ id: '1', url: '/a', method: 'POST', timestamp: 1 });
    queue.add({ id: '2', url: '/b', method: 'PUT', timestamp: 2 });

    queue.remove('1');

    expect(queue.size()).toBe(1);
    expect(queue.getAll()[0].id).toBe('2');
  });

  it('remove is a no-op for non-existent id', () => {
    queue.add({ id: '1', url: '/a', method: 'POST', timestamp: 1 });
    queue.remove('nonexistent');
    expect(queue.size()).toBe(1);
  });

  it('clears all items', () => {
    queue.add({ id: '1', url: '/a', method: 'POST', timestamp: 1 });
    queue.add({ id: '2', url: '/b', method: 'PUT', timestamp: 2 });

    queue.clear();

    expect(queue.size()).toBe(0);
    expect(queue.getAll()).toEqual([]);
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
  });

  it('persists to localStorage', () => {
    queue.add({ id: '1', url: '/a', method: 'POST', timestamp: 1 });

    const raw = localStorage.getItem(QUEUE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('1');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(QUEUE_KEY, 'not valid json{{{');

    // Should return empty array, not throw
    expect(queue.getAll()).toEqual([]);
    expect(queue.size()).toBe(0);
  });
});

describe('offlineFetch', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    originalFetch = globalThis.fetch;
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', {
      ...originalCrypto,
      randomUUID: vi.fn().mockReturnValue('mock-uuid'),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('passes through to fetch when online and fetch succeeds', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await offlineFetch('/api/test', { method: 'POST', body: '{}' });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', { method: 'POST', body: '{}' });
    expect(result.status).toBe(200);
  });

  it('queues non-GET request when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    const result = await offlineFetch('/api/test', { method: 'POST', body: '{"data":1}' });

    expect(result.status).toBe(202);
    const body = await result.json();
    expect(body.queued).toBe(true);

    const raw = localStorage.getItem(QUEUE_KEY);
    const items = JSON.parse(raw!);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('/api/test');
    expect(items[0].method).toBe('POST');
  });

  it('throws for GET requests when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    let caught: unknown;
    try {
      await offlineFetch('/api/data');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('Cannot perform GET requests while offline');
  });

  it('queues non-GET request when online fetch throws network error', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await offlineFetch('/api/test', { method: 'POST', body: '{}' });

    expect(result.status).toBe(202);
    const body = await result.json();
    expect(body.queued).toBe(true);
  });

  it('rethrows for GET request when online fetch throws network error', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    let caught: unknown;
    try {
      await offlineFetch('/api/data', { method: 'GET' });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('Network error');
  });

  it('defaults method to GET when options.method is not provided', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    let caught: unknown;
    try {
      await offlineFetch('/api/data');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe(
      'Cannot perform GET requests while offline',
    );
  });
});

describe('syncQueue', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('processes queued items and removes successful ones', async () => {
    // Manually add items to localStorage
    const items = [
      { id: '1', url: '/api/a', method: 'POST', body: '{}', timestamp: 1 },
      { id: '2', url: '/api/b', method: 'PUT', body: '{}', timestamp: 2 },
    ];
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const result = await syncQueue();

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);

    // Queue should be empty after sync
    const remaining = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    expect(remaining).toHaveLength(0);
  });

  it('increments failed count for non-ok responses', async () => {
    const items = [
      { id: '1', url: '/api/a', method: 'POST', body: '{}', timestamp: 1 },
    ];
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await syncQueue();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);

    // Item should still be in queue
    const remaining = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    expect(remaining).toHaveLength(1);
  });

  it('increments failed count for network errors', async () => {
    const items = [
      { id: '1', url: '/api/a', method: 'POST', body: '{}', timestamp: 1 },
    ];
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await syncQueue();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
  });

  it('returns zero counts for empty queue', async () => {
    const result = await syncQueue();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('handles mixed success/failure results', async () => {
    const items = [
      { id: '1', url: '/api/a', method: 'POST', body: '{}', timestamp: 1 },
      { id: '2', url: '/api/b', method: 'POST', body: '{}', timestamp: 2 },
      { id: '3', url: '/api/c', method: 'POST', body: '{}', timestamp: 3 },
    ];
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    const result = await syncQueue();

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(1);
  });
});
