// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useOptimisticMutation } from './useOptimisticMutation';

// Mock the api module
vi.mock('@services/api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@services/api';

const mockedApiFetch = apiFetch as ReturnType<typeof vi.fn>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useOptimisticMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mutation functions', () => {
    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          queryKey: ['test'],
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.mutate).toBeTypeOf('function');
    expect(result.current.mutateAsync).toBeTypeOf('function');
    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('calls apiFetch with correct path and method', async () => {
    mockedApiFetch.mockResolvedValue({ data: { id: 1 } });

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          queryKey: ['items'],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ path: '/api/items', method: 'POST', body: { name: 'test' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApiFetch).toHaveBeenCalledWith('/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });
  });

  it('defaults to POST method when not specified', async () => {
    mockedApiFetch.mockResolvedValue({ data: {} });

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          queryKey: ['items'],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ path: '/api/items' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApiFetch).toHaveBeenCalledWith('/api/items', {
      method: 'POST',
      body: undefined,
    });
  });

  it('sets isPending during mutation', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockedApiFetch.mockReturnValue(pendingPromise);

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          queryKey: ['items'],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ path: '/api/items', method: 'POST' });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    resolvePromise!({ data: {} });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('sets isError on mutation failure', async () => {
    mockedApiFetch.mockRejectedValue({ message: 'Server error', status: 500 });

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          queryKey: ['items'],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ path: '/api/items', method: 'POST' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
