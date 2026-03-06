import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import { User } from '@models/user.model.js';
import * as authService from './auth.service.js';

const TEST_PASSWORD = 'password123';
let passwordHash: string;

beforeEach(async () => {
  passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
});

async function createTestUser(overrides = {}) {
  return User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash,
    role: 'STUDENT',
    isActive: true,
    ...overrides,
  });
}

describe('authService.login', () => {
  it('returns user and tokens with valid credentials', async () => {
    await createTestUser();

    const result = await authService.login('test@example.com', TEST_PASSWORD);

    expect(result.user.email).toBe('test@example.com');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.tokens.jti).toBeDefined();
  });

  it('throws UNAUTHORIZED for wrong password', async () => {
    await createTestUser();

    await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('throws UNAUTHORIZED for nonexistent email', async () => {
    await expect(
      authService.login('nonexistent@example.com', TEST_PASSWORD),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('throws UNAUTHORIZED for inactive user', async () => {
    await createTestUser({ isActive: false });

    await expect(authService.login('test@example.com', TEST_PASSWORD)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('stores hashed jti in user refreshTokenJtis', async () => {
    const user = await createTestUser();

    const result = await authService.login('test@example.com', TEST_PASSWORD);
    const hashedJti = authService.hashJti(result.tokens.jti);

    const updatedUser = await User.findById(user._id).select('+refreshTokenJtis');
    expect(updatedUser!.refreshTokenJtis).toContain(hashedJti);
  });
});

describe('authService.generateTokens', () => {
  it('returns valid access and refresh JWTs', () => {
    const tokens = authService.generateTokens('user123', 'STUDENT');

    const accessPayload = jwt.verify(tokens.accessToken, env.JWT_SECRET) as Record<string, unknown>;
    expect(accessPayload.userId).toBe('user123');
    expect(accessPayload.role).toBe('STUDENT');

    const refreshPayload = jwt.verify(tokens.refreshToken, env.JWT_SECRET) as Record<
      string,
      unknown
    >;
    expect(refreshPayload.userId).toBe('user123');
    expect(refreshPayload.jti).toBe(tokens.jti);
  });
});

describe('authService.hashJti', () => {
  it('returns consistent SHA-256 hex string', () => {
    const jti = 'test-jti-value';
    const hash1 = authService.hashJti(jti);
    const hash2 = authService.hashJti(jti);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns different hashes for different inputs', () => {
    const hash1 = authService.hashJti('jti-1');
    const hash2 = authService.hashJti('jti-2');

    expect(hash1).not.toBe(hash2);
  });
});

describe('authService.refresh', () => {
  it('rotates tokens — old jti removed, new jti added', async () => {
    const user = await createTestUser();

    // Login to get initial tokens
    const loginResult = await authService.login('test@example.com', TEST_PASSWORD);
    const oldJti = loginResult.tokens.jti;
    const oldHashedJti = authService.hashJti(oldJti);

    // Refresh
    const refreshResult = await authService.refresh(user._id.toString(), oldJti);
    const newHashedJti = authService.hashJti(refreshResult.tokens.jti);

    const updatedUser = await User.findById(user._id).select('+refreshTokenJtis');
    expect(updatedUser!.refreshTokenJtis).not.toContain(oldHashedJti);
    expect(updatedUser!.refreshTokenJtis).toContain(newHashedJti);
  });

  it('throws UNAUTHORIZED for invalid jti', async () => {
    const user = await createTestUser();

    await expect(authService.refresh(user._id.toString(), 'invalid-jti')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });
});

describe('authService.logout', () => {
  it('removes jti from user refreshTokenJtis', async () => {
    const user = await createTestUser();

    const loginResult = await authService.login('test@example.com', TEST_PASSWORD);
    const jti = loginResult.tokens.jti;
    const hashedJti = authService.hashJti(jti);

    // Confirm jti was stored
    let updatedUser = await User.findById(user._id).select('+refreshTokenJtis');
    expect(updatedUser!.refreshTokenJtis).toContain(hashedJti);

    // Logout
    await authService.logout(user._id.toString(), jti);

    updatedUser = await User.findById(user._id).select('+refreshTokenJtis');
    expect(updatedUser!.refreshTokenJtis).not.toContain(hashedJti);
  });
});

describe('authService.invalidateAllSessions', () => {
  it('clears entire refreshTokenJtis array', async () => {
    const user = await createTestUser();

    // Login twice to create two sessions
    await authService.login('test@example.com', TEST_PASSWORD);
    await authService.login('test@example.com', TEST_PASSWORD);

    let updatedUser = await User.findById(user._id).select('+refreshTokenJtis');
    expect(updatedUser!.refreshTokenJtis.length).toBe(2);

    // Invalidate all
    await authService.invalidateAllSessions(user._id.toString());

    updatedUser = await User.findById(user._id).select('+refreshTokenJtis');
    expect(updatedUser!.refreshTokenJtis.length).toBe(0);
  });
});
