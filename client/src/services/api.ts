interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  correlationId: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    field?: string;
    retryAfterMs?: number;
  };
  correlationId: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly field?: string;
  public readonly retryAfterMs?: number;

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.error.message);
    this.name = 'ApiError';
    this.code = response.error.code;
    this.statusCode = statusCode;
    this.retryable = response.error.retryable;
    this.field = response.error.field;
    this.retryAfterMs = response.error.retryAfterMs;
  }
}

// Custom event dispatched when refresh fails — AuthContext listens for this
export const AUTH_REFRESH_FAILED_EVENT = 'auth:refresh-failed';

export function dispatchRefreshFailed(): void {
  window.dispatchEvent(new CustomEvent(AUTH_REFRESH_FAILED_EVENT));
}

// Module-level promise to deduplicate concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  // If a refresh is already in-flight, reuse its promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiSuccessResponse<T>> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body: ApiResponse<T> = await res.json();

  if (!body.success) {
    // On 401, attempt refresh before failing (skip for refresh endpoint itself)
    if (res.status === 401 && !path.startsWith('/auth/refresh')) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        // Retry the original request once
        const retryRes = await fetch(`/api${path}`, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        const retryBody: ApiResponse<T> = await retryRes.json();
        if (retryBody.success) {
          return retryBody as ApiSuccessResponse<T>;
        }
        throw new ApiError(retryBody as ApiErrorResponse, retryRes.status);
      }

      // Refresh failed — notify auth context and throw
      dispatchRefreshFailed();
      throw new ApiError(body as ApiErrorResponse, res.status);
    }

    throw new ApiError(body as ApiErrorResponse, res.status);
  }

  return body as ApiSuccessResponse<T>;
}

// Export for testing
export { refreshPromise as _refreshPromise };
