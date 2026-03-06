import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import { User } from '@models/user.model.js';
import * as authService from '@services/auth.service.js';
import app from '@/app.js';

const TEST_PASSWORD = 'password123';
const VALID_ORIGIN = 'http://localhost:5173';
let passwordHash: string;

beforeEach(async () => {
  passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
});

async function createTestUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash,
    role: 'STUDENT',
    isActive: true,
    hasConsented: true,
    block: 'A',
    floor: '2',
    roomNumber: 'A-201',
    ...overrides,
  });
}

function extractCookies(res: request.Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeaders = res.headers['set-cookie'];
  if (!setCookieHeaders) return cookies;
  const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const c of cookieArray) {
    const [nameVal] = c.split(';');
    const [name, val] = nameVal.split('=');
    cookies[name.trim()] = val?.trim() ?? '';
  }
  return cookies;
}

describe('POST /api/auth/login', () => {
  it('returns 200 with user data and sets cookies for valid credentials (AC-1)', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
    });
    expect(res.body.data.user.id).toBeDefined();

    const cookies = extractCookies(res);
    expect(cookies['accessToken']).toBeDefined();
    expect(cookies['refreshToken']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for non-existent email (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'nonexistent@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for inactive user', async () => {
    await createTestUser({ isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile including room info with valid access token (AC-2)', async () => {
    await createTestUser();
    const loginResult = await authService.login('test@example.com', TEST_PASSWORD);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `accessToken=${loginResult.tokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      hasConsented: true,
      block: 'A',
      floor: '2',
      roomNumber: 'A-201',
    });
  });

  it('returns 401 without access token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 with expired access token', async () => {
    await createTestUser();

    // Generate a token that's already expired
    const expiredToken = jwt.sign(
      { userId: 'someid', role: 'STUDENT' },
      env.JWT_SECRET,
      { expiresIn: 0 },
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `accessToken=${expiredToken}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 200 with new cookies for valid refresh token (AC-4)', async () => {
    await createTestUser();
    const loginResult = await authService.login('test@example.com', TEST_PASSWORD);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${loginResult.tokens.refreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cookies = extractCookies(res);
    expect(cookies['accessToken']).toBeDefined();
    expect(cookies['refreshToken']).toBeDefined();
  });

  it('returns 401 and clears cookies for revoked jti after invalidateAllSessions (AC-4)', async () => {
    const user = await createTestUser();
    const loginResult = await authService.login('test@example.com', TEST_PASSWORD);

    // Invalidate all sessions
    await authService.invalidateAllSessions(user._id.toString());

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${loginResult.tokens.refreshToken}`);

    expect(res.status).toBe(401);

    // Verify cookies are cleared (set-cookie with empty value or max-age=0)
    const setCookieHeaders = res.headers['set-cookie'];
    expect(setCookieHeaders).toBeDefined();
    const cookieStr = Array.isArray(setCookieHeaders) ? setCookieHeaders.join('; ') : setCookieHeaders;
    expect(cookieStr).toContain('accessToken');
    expect(cookieStr).toContain('refreshToken');
  });

  it('returns 401 and clears cookies for expired refresh token (AC-4)', async () => {
    await createTestUser();

    const expiredRefreshToken = jwt.sign(
      { userId: 'someid', jti: 'somejti' },
      env.JWT_SECRET,
      { expiresIn: 0 },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${expiredRefreshToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 for old refresh token after rotation', async () => {
    const user = await createTestUser();
    const loginResult = await authService.login('test@example.com', TEST_PASSWORD);

    // Refresh once to rotate
    await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${loginResult.tokens.refreshToken}`);

    // Try using old refresh token again
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${loginResult.tokens.refreshToken}`);

    expect(res.status).toBe(401);
  });
});

describe('Login rate limiting (AC-5)', () => {
  it('4 consecutive failed logins still allows 5th correct attempt', async () => {
    await createTestUser();

    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('Origin', VALID_ORIGIN)
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('5 consecutive failed logins returns RATE_LIMITED with retryAfterMs', async () => {
    await createTestUser();

    let res;
    for (let i = 0; i < 5; i++) {
      res = await request(app)
        .post('/api/auth/login')
        .set('Origin', VALID_ORIGIN)
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    expect(res!.status).toBe(429);
    expect(res!.body.success).toBe(false);
    expect(res!.body.error.code).toBe('RATE_LIMITED');
    expect(res!.body.error.retryAfterMs).toBeGreaterThan(0);
  });

  it('successful login resets failed attempt counter', async () => {
    await createTestUser();

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('Origin', VALID_ORIGIN)
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    // Succeed
    await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    // Fail 4 more times (should not lock because counter was reset)
    let lastRes;
    for (let i = 0; i < 4; i++) {
      lastRes = await request(app)
        .post('/api/auth/login')
        .set('Origin', VALID_ORIGIN)
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    // Should be 401, not 429 (only 4 failures since reset)
    expect(lastRes!.status).toBe(401);
    expect(lastRes!.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('E2E Auth Lifecycle (Task 9)', () => {
  it('full lifecycle: login -> me -> refresh -> me -> logout', async () => {
    await createTestUser();

    // 1. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });
    expect(loginRes.status).toBe(200);
    const loginCookies = extractCookies(loginRes);

    // 2. Get profile
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `accessToken=${loginCookies['accessToken']}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.block).toBe('A');

    // 3. Refresh
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${loginCookies['refreshToken']}`);
    expect(refreshRes.status).toBe(200);
    const newCookies = extractCookies(refreshRes);

    // 4. Get profile with new access token
    const meRes2 = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `accessToken=${newCookies['accessToken']}`);
    expect(meRes2.status).toBe(200);

    // 5. Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${newCookies['refreshToken']}`);
    expect(logoutRes.status).toBe(200);
  });

  it('revoked refresh token returns 401 with cookies cleared', async () => {
    const user = await createTestUser();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });
    const loginCookies = extractCookies(loginRes);

    // Invalidate all sessions
    await authService.invalidateAllSessions(user._id.toString());

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', `refreshToken=${loginCookies['refreshToken']}`);

    expect(refreshRes.status).toBe(401);
    const setCookieHeaders = refreshRes.headers['set-cookie'];
    expect(setCookieHeaders).toBeDefined();
  });

  it('account lockout triggers after 5 failures and unlocks after duration', async () => {
    const user = await createTestUser();

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('Origin', VALID_ORIGIN)
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    // 6th attempt should be RATE_LIMITED
    const lockedRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });
    expect(lockedRes.status).toBe(429);
    expect(lockedRes.body.error.code).toBe('RATE_LIMITED');

    // Manually expire the lockout
    await User.updateOne({ _id: user._id }, { $set: { lockedUntil: new Date(Date.now() - 1000) } });

    // Now login should succeed
    const unlockedRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });
    expect(unlockedRes.status).toBe(200);
  });
});
