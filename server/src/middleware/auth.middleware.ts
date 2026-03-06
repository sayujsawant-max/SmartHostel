import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import { AppError } from '@utils/app-error.js';

interface JwtPayload {
  userId: string;
  role: string;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken;
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { _id: decoded.userId, role: decoded.role };
    next();
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
  }
}
