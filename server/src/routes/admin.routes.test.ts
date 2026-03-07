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

async function loginAs(role = 'STUDENT', email = 'test@example.com') {
  await createTestUser({ role, email, hasConsented: true });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .set('Origin', VALID_ORIGIN)
    .send({ email, password: TEST_PASSWORD });
  return extractCookies(loginRes);
}

describe('GET /api/admin/users', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/admin/users');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for authenticated STUDENT', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns user list with WARDEN_ADMIN auth', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    // Should include the admin user we just created
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/admin/users', () => {
  it('creates new user with WARDEN_ADMIN auth', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .post('/api/admin/users')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        name: 'New Student',
        email: 'student@example.com',
        password: 'securepass123',
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name: 'New Student',
      email: 'student@example.com',
      role: 'STUDENT',
      isActive: true,
    });
    expect(res.body.correlationId).toBeDefined();
  });
});

describe('PATCH /api/admin/users/:id/disable', () => {
  it('disables user with WARDEN_ADMIN auth', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    // Create a user to disable
    const student = await createTestUser({
      email: 'todisable@example.com',
      name: 'Disable Me',
    });

    const res = await request(app)
      .patch(`/api/admin/users/${student._id}/disable`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('User account disabled');

    // Verify user is disabled in DB
    const updated = await User.findById(student._id);
    expect(updated!.isActive).toBe(false);
  });
});

describe('POST /api/admin/users/:id/reset-password', () => {
  it('resets password with WARDEN_ADMIN auth', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const student = await createTestUser({
      email: 'resetme@example.com',
      name: 'Reset Me',
    });

    const res = await request(app)
      .post(`/api/admin/users/${student._id}/reset-password`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ password: 'newSecurePass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Password reset successfully');
  });

  it('returns 403 for STUDENT role', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const target = await createTestUser({
      email: 'target@example.com',
      name: 'Target User',
    });

    const res = await request(app)
      .post(`/api/admin/users/${target._id}/reset-password`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ password: 'newSecurePass123' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
