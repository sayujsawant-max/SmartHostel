import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import app from '@/app.js';
import { env } from '@config/env.js';
import { requireRole } from '@middleware/rbac.middleware.js';

const VALID_ORIGIN = 'http://localhost:5173';
const TEST_PASSWORD = 'password123';

/** Create a user and return a signed access token cookie string */
async function createUserAndToken(role: string, email?: string) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  const user = await User.create({
    name: `Test ${role}`,
    email: email || `${role.toLowerCase()}@test.com`,
    passwordHash,
    role,
    isActive: true,
    hasConsented: true,
    ...(role === 'STUDENT' ? { block: 'A', floor: '2', roomNumber: '201' } : {}),
  });

  const accessToken = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  return { user, accessToken };
}

describe('requireRole() middleware — unit tests', () => {
  it('allows request when user role matches single allowed role', () => {
    const middleware = requireRole('WARDEN_ADMIN');
    const req = { user: { _id: 'u1', role: 'WARDEN_ADMIN' } } as any;
    const res = {} as any;
    let called = false;
    const next = () => { called = true; };

    middleware(req, res, next);
    expect(called).toBe(true);
  });

  it('rejects request when user role does not match (403)', () => {
    const middleware = requireRole('WARDEN_ADMIN');
    const req = { user: { _id: 'u1', role: 'STUDENT' } } as any;
    const res = {} as any;

    expect(() => middleware(req, res, () => {})).toThrow();
    try {
      middleware(req, res, () => {});
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    }
  });

  it('allows request when user role matches one of multiple allowed roles', () => {
    const middleware = requireRole('STUDENT', 'WARDEN_ADMIN');
    let called = false;

    // Test STUDENT
    middleware(
      { user: { _id: 'u1', role: 'STUDENT' } } as any,
      {} as any,
      () => { called = true; },
    );
    expect(called).toBe(true);

    // Test WARDEN_ADMIN
    called = false;
    middleware(
      { user: { _id: 'u2', role: 'WARDEN_ADMIN' } } as any,
      {} as any,
      () => { called = true; },
    );
    expect(called).toBe(true);
  });

  it('returns 401 when req.user is not set', () => {
    const middleware = requireRole('GUARD');
    const req = {} as any;

    try {
      middleware(req, {} as any, () => {});
    } catch (err: any) {
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects GUARD from warden-only endpoint (403)', () => {
    const middleware = requireRole('WARDEN_ADMIN');
    const req = { user: { _id: 'u1', role: 'GUARD' } } as any;

    expect(() => middleware(req, {} as any, () => {})).toThrow();
    try {
      middleware(req, {} as any, () => {});
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
    }
  });

  it('rejects GUARD from complaint endpoints (403)', () => {
    const middleware = requireRole('STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE');
    const req = { user: { _id: 'u1', role: 'GUARD' } } as any;

    expect(() => middleware(req, {} as any, () => {})).toThrow();
    try {
      middleware(req, {} as any, () => {});
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
    }
  });
});

describe('RBAC integration tests via test routes', () => {
  it('STUDENT accessing /api/test/admin-only returns 403', async () => {
    const { accessToken } = await createUserAndToken('STUDENT');

    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('WARDEN_ADMIN accessing /api/test/admin-only returns 200', async () => {
    const { accessToken } = await createUserAndToken('WARDEN_ADMIN');

    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GUARD accessing /api/test/admin-only returns 403', async () => {
    const { accessToken } = await createUserAndToken('GUARD');

    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(403);
  });

  it('GUARD accessing /api/test/complaints returns 403 (AC-2)', async () => {
    const { accessToken } = await createUserAndToken('GUARD');

    const res = await request(app)
      .get('/api/test/complaints')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('STUDENT accessing /api/test/complaints returns 200 with studentId filter (AC-3)', async () => {
    const { user, accessToken } = await createUserAndToken('STUDENT');

    const res = await request(app)
      .get('/api/test/complaints')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.data.filter).toEqual({ studentId: user._id.toString() });
  });

  it('WARDEN_ADMIN accessing /api/test/complaints returns 200 with no filter (AC-4)', async () => {
    const { accessToken } = await createUserAndToken('WARDEN_ADMIN', 'warden2@test.com');

    const res = await request(app)
      .get('/api/test/complaints')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.data.filter).toEqual({});
  });

  it('MAINTENANCE accessing /api/test/complaints returns 200 with assignedTo filter (AC-5)', async () => {
    const { user, accessToken } = await createUserAndToken('MAINTENANCE');

    const res = await request(app)
      .get('/api/test/complaints')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.data.filter).toEqual({ assignedTo: user._id.toString() });
  });

  it('MAINTENANCE accessing /api/test/maintenance-tasks returns 200 with assignedTo filter', async () => {
    const { user, accessToken } = await createUserAndToken('MAINTENANCE', 'maint2@test.com');

    const res = await request(app)
      .get('/api/test/maintenance-tasks')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.data.filter).toEqual({ assignedTo: user._id.toString() });
  });

  it('STUDENT accessing /api/test/maintenance-tasks returns 403', async () => {
    const { accessToken } = await createUserAndToken('STUDENT', 'student2@test.com');

    const res = await request(app)
      .get('/api/test/maintenance-tasks')
      .set('Cookie', `accessToken=${accessToken}`)
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(403);
  });

  it('unauthenticated request to protected endpoint returns 401', async () => {
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Origin', VALID_ORIGIN);

    expect(res.status).toBe(401);
  });
});
