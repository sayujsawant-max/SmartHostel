import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { env } from '@config/env.js';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  jti: string;
}

const SALT_ROUNDS = 10;

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

export async function register(
  name: string,
  email: string,
  password: string,
  gender: string,
  academicYear: string,
  correlationId?: string,
) {
  const normalizedEmail = email.toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('CONFLICT', 'A user with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: 'STUDENT',
    gender,
    academicYear,
  });

  const tokens = generateTokens(user._id.toString(), user.role);
  const hashedJti = hashJti(tokens.jti);
  await User.updateOne({ _id: user._id }, { $push: { refreshTokenJtis: hashedJti } });

  logger.info(
    { eventType: 'AUTH_REGISTER', correlationId, userId: user._id.toString() },
    'User registered',
  );

  return { user, tokens };
}

export async function login(email: string, password: string, correlationId?: string) {
  // Select lockout fields explicitly (they have select: false)
  const user = await User.findOne({ email, isActive: true })
    .select('+failedLoginAttempts +lockedUntil');

  // Check if account is locked before doing anything
  if (user?.lockedUntil) {
    if (user.lockedUntil.getTime() > Date.now()) {
      const retryAfterMs = user.lockedUntil.getTime() - Date.now();
      logger.warn(
        { eventType: 'AUTH_LOCKED_ATTEMPT', correlationId, userId: user._id.toString() },
        'Login attempt on locked account',
      );
      throw new AppError('RATE_LIMITED', 'Account temporarily locked', 429, {
        retryable: true,
        retryAfterMs,
      });
    }
    // Lockout has expired — reset counter so the next wrong password doesn't immediately re-lock
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  // Always run bcrypt.compare to prevent timing attacks (constant-time regardless of user existence)
  const isMatch = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !isMatch) {
    // If user exists, track failed attempt
    if (user) {
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateFields: Record<string, unknown> = {
        failedLoginAttempts: newFailedAttempts,
      };

      if (newFailedAttempts >= env.MAX_LOGIN_ATTEMPTS) {
        updateFields.lockedUntil = new Date(Date.now() + env.LOGIN_LOCKOUT_DURATION_MS);
        logger.warn(
          {
            eventType: 'AUTH_LOCKOUT',
            correlationId,
            userId: user._id.toString(),
            failedAttempts: newFailedAttempts,
          },
          'Account locked due to too many failed login attempts',
        );
      }

      await User.updateOne({ _id: user._id }, { $set: updateFields });

      logger.info(
        {
          eventType: 'AUTH_FAILED',
          correlationId,
          userId: user._id.toString(),
          failedAttempts: newFailedAttempts,
        },
        'Failed login attempt',
      );

      // If this attempt triggered the lockout, return RATE_LIMITED
      if (newFailedAttempts >= env.MAX_LOGIN_ATTEMPTS) {
        throw new AppError('RATE_LIMITED', 'Account temporarily locked', 429, {
          retryable: true,
          retryAfterMs: env.LOGIN_LOCKOUT_DURATION_MS,
        });
      }
    }

    throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
  }

  // Successful login — reset failed attempts and lockedUntil
  const tokens = generateTokens(user._id.toString(), user.role);
  const hashedJti = hashJti(tokens.jti);

  await User.updateOne(
    { _id: user._id },
    {
      $push: { refreshTokenJtis: hashedJti },
      $set: { failedLoginAttempts: 0, lockedUntil: null },
    },
  );

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

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function forgotPassword(email: string, correlationId?: string) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  // Always return success to prevent email enumeration
  if (!user) {
    logger.info({ eventType: 'AUTH_FORGOT_NO_USER', correlationId, email }, 'Forgot password for unknown email');
    return;
  }

  const token = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(token).digest('hex');

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      },
    },
  );

  // In development, log the reset link to the console
  const resetUrl = `${env.ALLOWED_ORIGINS.split(',')[0].trim()}/reset-password?token=${token}`;
  if (env.NODE_ENV === 'development') {
    logger.info(
      { eventType: 'AUTH_RESET_LINK', correlationId, userId: user._id.toString(), resetUrl },
      `Password reset link (dev only): ${resetUrl}`,
    );
  }

  // TODO: In production, send email with resetUrl

  logger.info(
    { eventType: 'AUTH_FORGOT', correlationId, userId: user._id.toString() },
    'Password reset token generated',
  );
}

export async function resetPassword(token: string, newPassword: string, correlationId?: string) {
  const hashedToken = createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
    isActive: true,
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshTokenJtis: [], // invalidate all sessions
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    },
  );

  logger.info(
    { eventType: 'AUTH_RESET_PASSWORD', correlationId, userId: user._id.toString() },
    'Password reset successfully',
  );
}

export async function googleLogin(googleId: string, email: string, name: string, correlationId?: string) {
  // Check if user exists by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user && !user.googleId) {
    // Existing email user — link Google account
    await User.updateOne({ _id: user._id }, { $set: { googleId } });
    user.googleId = googleId;
  }

  if (!user) {
    // Create new user with Google
    user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), SALT_ROUNDS), // random password
      role: 'STUDENT',
      googleId,
    });
  }

  if (!user.isActive) {
    throw new AppError('UNAUTHORIZED', 'Account is disabled', 401);
  }

  const tokens = generateTokens(user._id.toString(), user.role);
  const hashedJti = hashJti(tokens.jti);
  await User.updateOne({ _id: user._id }, { $push: { refreshTokenJtis: hashedJti } });

  logger.info(
    { eventType: 'AUTH_GOOGLE_LOGIN', correlationId, userId: user._id.toString() },
    'User logged in via Google',
  );

  return { user, tokens };
}
