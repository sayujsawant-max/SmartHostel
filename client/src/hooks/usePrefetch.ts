import { useCallback } from 'react';
import { queryClient } from '@/lib/query-client';
import { apiFetch } from '@services/api';

/**
 * Returns an onMouseEnter handler that prefetches data for a route.
 * Use on nav links to make page transitions feel instant.
 */
export function usePrefetch(queryKey: readonly unknown[], path: string) {
  return useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const res = await apiFetch(path);
        return res.data;
      },
      staleTime: 30_000,
    });
  }, [queryKey, path]);
}
