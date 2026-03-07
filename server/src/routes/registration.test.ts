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

describe('POST /api/auth/register', () => {
  it('returns 201 with user data and sets cookies on valid registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Origin', VALID_ORIGIN)
      .send({ name: 'New User', email: 'newuser@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name: 'New User',
      email: 'newuser@example.com',
      role: 'STUDENT',
    });
    expect(res.body.correlationId).toBeDefined();

    const cookies = extractCookies(res);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.refreshToken).toBeDefined();
  });

  it('returns 409 when registering with duplicate email', async () => {
    await createTestUser({ email: 'duplicate@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .set('Origin', VALID_ORIGIN)
      .send({ name: 'Another User', email: 'duplicate@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 VALIDATION_ERROR with invalid data (short password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Origin', VALID_ORIGIN)
      .send({ name: 'Test', email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
