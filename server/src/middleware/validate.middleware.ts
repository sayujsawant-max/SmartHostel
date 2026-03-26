import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '@utils/app-error.js';

/**
 * Express middleware factory that validates request body, query, or params
 * against a Zod schema. Returns 400 with structured error on failure.
 *
 * Usage:
 *   router.post('/foo', validate(fooSchema), controller.create);
 *   router.get('/bar', validate(querySchema, 'query'), controller.list);
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const field = firstIssue?.path[0]?.toString();
      const message = firstIssue?.message ?? 'Validation failed';

      throw new AppError('VALIDATION_ERROR', message, 400, { field });
    }

    // Replace with parsed (coerced/transformed) data
    req[source] = result.data;
    next();
  };
}
