import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import app from '../app.js';

const TEST_PASSWORD = 'password123';
const VALID_ORIGIN = 'http://localhost:5173';
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

function extractCookies(res: request.Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeaders = res.headers['set-cookie'];
  if (setCookieHeaders) {
    const headerArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    for (const cookie of headerArray) {
      const [nameValue] = cookie.split(';');
      const eqIdx = nameValue.indexOf('=');
      const name = nameValue.substring(0, eqIdx).trim();
      const value = nameValue.substring(eqIdx + 1).trim();
      cookies[name] = value;
    }
  }
  return cookies;
}

describe('POST /api/auth/login', () => {
  it('returns 200 with user data and sets cookies on valid login', async () => {
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
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.correlationId).toBeDefined();

    // Check cookies are set
    const cookies = extractCookies(res);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.refreshToken).toBeDefined();

    // Check cookie attributes
    const setCookieHeaders = res.headers['set-cookie'] as unknown as string[];
    const accessCookie = setCookieHeaders.find((c: string) => c.startsWith('accessToken='));
    const refreshCookie = setCookieHeaders.find((c: string) => c.startsWith('refreshToken='));

    expect(accessCookie).toContain('HttpOnly');
    expect(accessCookie).toContain('Path=/');
    expect(accessCookie).toContain('SameSite=Lax');

    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/api/auth');
    expect(refreshCookie).toContain('SameSite=Lax');
  });

  it('returns 401 with UNAUTHORIZED for invalid credentials', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.correlationId).toBeDefined();
  });

  it('returns 400 for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile with valid access token', async () => {
    await createTestUser({ hasConsented: true });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    const cookies = extractCookies(loginRes);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      hasConsented: true,
    });
    expect(res.body.correlationId).toBeDefined();
  });

  it('returns 401 without access token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 200 and sets new cookies with valid refresh token', async () => {
    await createTestUser();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    const loginCookies = extractCookies(loginRes);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`refreshToken=${loginCookies.refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // New cookies should be set
    const newCookies = extractCookies(res);
    expect(newCookies.accessToken).toBeDefined();
    expect(newCookies.refreshToken).toBeDefined();
  });

  it('returns 401 when replaying old refresh token after rotation', async () => {
    await createTestUser();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    const loginCookies = extractCookies(loginRes);

    // First refresh — succeeds and rotates the token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`refreshToken=${loginCookies.refreshToken}`]);

    expect(refreshRes.status).toBe(200);

    // Replay OLD refresh token — must be rejected (jti already consumed)
    const replayRes = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`refreshToken=${loginCookies.refreshToken}`]);

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 with invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', ['refreshToken=invalid-token']);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 without refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears cookies with valid refresh token', async () => {
    await createTestUser();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    const loginCookies = extractCookies(loginRes);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`refreshToken=${loginCookies.refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify jti was removed from DB
    const user = await User.findOne({ email: 'test@example.com' }).select('+refreshTokenJtis');
    expect(user!.refreshTokenJtis.length).toBe(0);

    // Verify cookies are cleared (Set-Cookie with expired dates)
    const setCookieHeaders = res.headers['set-cookie'] as unknown as string[];
    const clearedAccess = setCookieHeaders.find((c: string) => c.startsWith('accessToken='));
    const clearedRefresh = setCookieHeaders.find((c: string) => c.startsWith('refreshToken='));
    expect(clearedAccess).toContain('Expires=Thu, 01 Jan 1970');
    expect(clearedRefresh).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('returns 200 with no cookies (idempotent)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
