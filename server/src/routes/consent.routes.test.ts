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

describe('POST /api/consents', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/consents')
      .set('Origin', VALID_ORIGIN)
      .send({ version: '1.0' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 201 with consent record and sets hasConsented on user', async () => {
    // Create user without consent so we can verify it gets set
    await createTestUser({ hasConsented: false, email: 'consent@example.com' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'consent@example.com', password: TEST_PASSWORD });
    const cookies = extractCookies(loginRes);

    const res = await request(app)
      .post('/api/consents')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ version: '1.0' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.consent).toMatchObject({
      version: '1.0',
    });
    expect(res.body.data.consent.id).toBeDefined();
    expect(res.body.data.consent.userId).toBeDefined();
    expect(res.body.data.consent.consentedAt).toBeDefined();
    expect(res.body.correlationId).toBeDefined();

    // Verify hasConsented was set to true on the user
    const user = await User.findOne({ email: 'consent@example.com' });
    expect(user!.hasConsented).toBe(true);
  });

  it('returns 400 without version field', async () => {
    const cookies = await loginAs('STUDENT', 'noversion@example.com');

    const res = await request(app)
      .post('/api/consents')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
