import bcrypt from 'bcryptjs';
import type { CreateUserInput } from '@smarthostel/shared';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';
import { paginate, type PaginationParams } from '@utils/paginate.js';

const SALT_ROUNDS = 10;

export async function listUsers(params: PaginationParams = {}) {
  return paginate(User, {}, params, { sort: { createdAt: -1 } });
}

export async function createUser(data: CreateUserInput, correlationId?: string) {
  const email = data.email.toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('CONFLICT', 'A user with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name: data.name,
      email,
      passwordHash,
      role: data.role,
      block: data.block,
      floor: data.floor,
      roomNumber: data.roomNumber,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      throw new AppError('CONFLICT', 'A user with this email already exists', 409);
    }
    throw err;
  }

  logger.info(
    { eventType: 'ADMIN_USER_CREATED', correlationId, userId: user._id.toString(), role: data.role },
    'User account created',
  );

  return user;
}

export async function enableUser(userId: string, correlationId?: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  await User.updateOne({ _id: userId }, { $set: { isActive: true } });

  logger.info(
    { eventType: 'ADMIN_USER_ENABLED', correlationId, userId },
    'User account enabled',
  );
}

export async function disableUser(userId: string, actorId: string, correlationId?: string) {
  if (String(userId) === String(actorId)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot disable your own account', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  await User.updateOne(
    { _id: userId },
    { $set: { isActive: false, refreshTokenJtis: [] } },
  );

  logger.info(
    { eventType: 'ADMIN_USER_DISABLED', correlationId, targetUserId: userId, actorId },
    'User account disabled',
  );
}

export async function resetPassword(userId: string, newPassword: string, correlationId?: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await User.updateOne(
    { _id: userId },
    { $set: { passwordHash, refreshTokenJtis: [], failedLoginAttempts: 0, lockedUntil: null } },
  );

  logger.info(
    { eventType: 'ADMIN_PASSWORD_RESET', correlationId, targetUserId: userId },
    'User password reset',
  );
}
