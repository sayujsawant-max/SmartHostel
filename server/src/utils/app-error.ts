import type { ErrorCode } from '@smarthostel/shared';

interface AppErrorOptions {
  retryable?: boolean;
  retryAfterMs?: number;
  field?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly retryAfterMs?: number;
  public readonly field?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
    this.field = options.field;
  }
}
