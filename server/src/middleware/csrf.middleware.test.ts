import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import app from '@/app.js';

const VALID_ORIGIN = 'http://localhost:5173';
const TEST_PASSWORD = 'password123';

async function createTestUser() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  return User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash,
    role: 'STUDENT',
    isActive: true,
    hasConsented: true,
  });
}

describe('CSRF Middleware', () => {
  it('allows GET requests regardless of Origin header', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://evil.com');

    // Should not be 403 — GET is exempt
    expect(res.status).not.toBe(403);
  });

  it('allows POST with matching Origin header', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    // Should not be 403
    expect(res.status).not.toBe(403);
  });

  it('allows POST with matching Referer header (when Origin is absent)', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Referer', `${VALID_ORIGIN}/login`)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).not.toBe(403);
  });

  it('rejects POST with non-matching Origin header (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://evil.com')
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects POST with no Origin or Referer header (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects DELETE with non-matching Origin (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .delete('/api/auth/logout')
      .set('Origin', 'http://evil.com');

    expect(res.status).toBe(403);
  });

  it('allows PATCH with matching Origin', async () => {
    // PATCH to a non-existent endpoint — should not get 403
    const res = await request(app)
      .patch('/api/nonexistent')
      .set('Origin', VALID_ORIGIN)
      .send({});

    // Should get 404, not 403
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/login with correct Origin succeeds (integration)', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/auth/login with wrong Origin returns 403 (integration)', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://evil-site.com')
      .send({ email: 'test@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
