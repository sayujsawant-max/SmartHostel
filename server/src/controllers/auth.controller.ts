import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema } from '@smarthostel/shared';
import { env } from '@config/env.js';
import * as authService from '@services/auth.service.js';
import { setAuthCookies, clearAuthCookies } from '@utils/auth-cookies.js';
import { AppError } from '@utils/app-error.js';

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid registration input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const { name, email, password, gender, academicYear } = parsed.data;
  const result = await authService.register(name, email, password, gender, academicYear, req.correlationId);

  setAuthCookies(res, result.tokens);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        gender: result.user.gender,
        academicYear: result.user.academicYear,
        hasConsented: result.user.hasConsented,
      },
    },
    correlationId: req.correlationId,
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid login input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const { email, password } = parsed.data;
  const result = await authService.login(email, password, req.correlationId);

  setAuthCookies(res, result.tokens);

  res.json({
    success: true,
    data: {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        gender: result.user.gender,
        academicYear: result.user.academicYear,
        hasConsented: result.user.hasConsented,
        block: result.user.block,
        floor: result.user.floor,
        roomNumber: result.user.roomNumber,
      },
    },
    correlationId: req.correlationId,
  });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        academicYear: user.academicYear,
        hasConsented: user.hasConsented,
        block: user.block,
        floor: user.floor,
        roomNumber: user.roomNumber,
      },
    },
    correlationId: req.correlationId,
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    clearAuthCookies(res);
    throw new AppError('UNAUTHORIZED', 'Refresh token required', 401);
  }

  let payload: { userId: string; jti: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; jti: string };
  } catch {
    clearAuthCookies(res);
    throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }

  let result;
  try {
    result = await authService.refresh(payload.userId, payload.jti, req.correlationId);
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }

  setAuthCookies(res, result.tokens);

  res.json({
    success: true,
    data: {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    },
    correlationId: req.correlationId,
  });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; jti: string };
      await authService.logout(payload.userId, payload.jti, req.correlationId);
    } catch {
      // Token invalid/expired — still clear cookies (idempotent)
    }
  }

  clearAuthCookies(res);

  res.json({
    success: true,
    data: { message: 'Logged out' },
    correlationId: req.correlationId,
  });
}
