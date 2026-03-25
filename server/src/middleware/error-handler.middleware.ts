import type { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@smarthostel/shared';
import { Sentry } from '@config/sentry.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // Express requires 4 args to identify error middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(
      {
        eventType: 'APP_ERROR',
        correlationId,
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        field: err.field,
      },
      err.message,
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        retryable: err.retryable,
        ...(err.field && { field: err.field }),
        ...(err.retryAfterMs && { retryAfterMs: err.retryAfterMs }),
      },
      correlationId,
    });
    return;
  }

  // Unhandled error — report to Sentry and never expose internals
  Sentry.captureException(err, { extra: { correlationId } });
  logger.error(
    {
      eventType: 'UNHANDLED_ERROR',
      correlationId,
      error: err.message,
      stack: err.stack,
    },
    'Unhandled server error',
  );

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      retryable: false,
    },
    correlationId,
  });
}
