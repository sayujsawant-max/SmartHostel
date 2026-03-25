import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiFetch } from '@services/api';
import type { ApiError } from '@services/api';

/**
 * Wrapper around useQuery that calls apiFetch and unwraps .data automatically.
 */
export function useApiQuery<T>(
  key: readonly unknown[],
  path: string,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: async () => {
      const res = await apiFetch<T>(path);
      return res.data;
    },
    ...options,
  });
}

/**
 * Wrapper around useMutation that calls apiFetch with method/body.
 */
export function useApiMutation<TData, TVariables extends { path: string; method?: string; body?: unknown }>(
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>,
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const res = await apiFetch<TData>(variables.path, {
        method: variables.method ?? 'POST',
        body: variables.body ? JSON.stringify(variables.body) : undefined,
      });
      return res.data;
    },
    ...options,
  });
}

/**
 * Convenience hook to invalidate queries after mutations.
 */
export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: readonly unknown[][]) => {
    for (const key of keys) {
      void qc.invalidateQueries({ queryKey: key });
    }
  };
}
