import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@smarthostel/shared';
import { AppError } from '@utils/app-error.js';

/**
 * Role-based access control middleware factory.
 * Must be used AFTER authMiddleware (requires req.user to be set).
 *
 * @param allowedRoles - One or more roles permitted to access the route
 * @returns Express middleware that checks req.user.role against allowedRoles
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    }

    next();
  };
}
