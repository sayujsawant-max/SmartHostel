import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { apiFetch } from '@services/api';
import type { ApiError } from '@services/api';

interface OptimisticMutationOptions<TData, TVariables> {
  /** The query key to optimistically update */
  queryKey: readonly unknown[];
  /** Build the optimistic data update */
  optimisticUpdate?: (old: TData | undefined, variables: TVariables) => TData;
  /** Additional mutation options */
  mutationOptions?: Omit<UseMutationOptions<unknown, ApiError, TVariables>, 'mutationFn'>;
}

/**
 * A mutation hook that supports optimistic updates.
 * Rolls back on error, invalidates on settle.
 */
export function useOptimisticMutation<TData, TVariables extends { path: string; method?: string; body?: unknown }>(
  options: OptimisticMutationOptions<TData, TVariables>,
) {
  const qc = useQueryClient();

  return useMutation<unknown, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const res = await apiFetch(variables.path, {
        method: variables.method ?? 'POST',
        body: variables.body ? JSON.stringify(variables.body) : undefined,
      });
      return res.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: options.queryKey });

      // Snapshot previous value
      const previous = qc.getQueryData<TData>(options.queryKey);

      // Optimistically update
      if (options.optimisticUpdate && previous !== undefined) {
        qc.setQueryData(options.queryKey, options.optimisticUpdate(previous, variables));
      }

      return { previous };
    },
    onError: (_err, _variables, context) => {
      // Roll back on error
      if (context && typeof context === 'object' && 'previous' in context) {
        qc.setQueryData(options.queryKey, (context as { previous: TData }).previous);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      void qc.invalidateQueries({ queryKey: options.queryKey });
    },
    ...options.mutationOptions,
  });
}
