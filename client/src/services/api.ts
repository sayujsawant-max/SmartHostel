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

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.error.message);
    this.name = 'ApiError';
    this.code = response.error.code;
    this.statusCode = statusCode;
    this.retryable = response.error.retryable;
    this.field = response.error.field;
  }
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
    throw new ApiError(body as ApiErrorResponse, res.status);
  }

  return body as ApiSuccessResponse<T>;
}
