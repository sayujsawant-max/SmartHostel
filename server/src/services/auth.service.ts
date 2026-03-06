import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { env } from '@config/env.js';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  jti: string;
}

// Dummy hash used when user not found — prevents timing-based user enumeration
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export function hashJti(jti: string): string {
  return createHash('sha256').update(jti).digest('hex');
}

export function generateTokens(userId: string, role: string): TokenPair {
  const jti = randomUUID();

  const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: Math.floor(env.ACCESS_TOKEN_EXPIRY / 1000),
  });

  const refreshToken = jwt.sign({ userId, jti }, env.JWT_SECRET, {
    expiresIn: Math.floor(env.REFRESH_TOKEN_EXPIRY / 1000),
  });

  return { accessToken, refreshToken, jti };
}

export async function login(email: string, password: string, correlationId?: string) {
  const user = await User.findOne({ email, isActive: true });

  // Always run bcrypt.compare to prevent timing attacks (constant-time regardless of user existence)
  const isMatch = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !isMatch) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
  }

  const tokens = generateTokens(user._id.toString(), user.role);
  const hashedJti = hashJti(tokens.jti);

  await User.updateOne({ _id: user._id }, { $push: { refreshTokenJtis: hashedJti } });

  logger.info(
    { eventType: 'AUTH_LOGIN', correlationId, userId: user._id.toString(), role: user.role },
    'User logged in',
  );

  return { user, tokens };
}

export async function refresh(userId: string, currentJti: string, correlationId?: string) {
  const hashedOldJti = hashJti(currentJti);

  // Get user + role for new access token
  const user = await User.findOne({ _id: userId, isActive: true });
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'User not found or inactive', 401);
  }

  // Generate new tokens first so we have the new jti
  const tokens = generateTokens(userId, user.role);
  const hashedNewJti = hashJti(tokens.jti);

  // Atomic check + remove old jti (proves ownership)
  const result = await User.findOneAndUpdate(
    { _id: userId, refreshTokenJtis: hashedOldJti },
    { $pull: { refreshTokenJtis: hashedOldJti } },
    { returnDocument: 'after' },
  ).select('+refreshTokenJtis');

  if (!result) {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  }

  // Store new jti
  await User.updateOne({ _id: userId }, { $push: { refreshTokenJtis: hashedNewJti } });

  logger.info({ eventType: 'AUTH_REFRESH', correlationId, userId }, 'Token refreshed');

  return { user, tokens };
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('UNAUTHORIZED', 'User not found or inactive', 401);
  }
  return user;
}

export async function logout(userId: string, jti: string, correlationId?: string) {
  const hashedJti = hashJti(jti);
  await User.updateOne({ _id: userId }, { $pull: { refreshTokenJtis: hashedJti } });

  logger.info({ eventType: 'AUTH_LOGOUT', correlationId, userId }, 'User logged out');
}

export async function invalidateAllSessions(userId: string, correlationId?: string) {
  await User.updateOne({ _id: userId }, { $set: { refreshTokenJtis: [] } });

  logger.info(
    { eventType: 'AUTH_INVALIDATE_ALL', correlationId, userId },
    'All sessions invalidated',
  );
}
