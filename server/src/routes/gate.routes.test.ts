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

async function loginAs(role: string, email: string) {
  await User.create({
    name: `${role} User`,
    email,
    passwordHash,
    role,
    isActive: true,
    hasConsented: true,
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .set('Origin', VALID_ORIGIN)
    .send({ email, password: TEST_PASSWORD });
  return extractCookies(loginRes);
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

/**
 * Helper: create a leave as student, approve it as warden, return the passCode.
 */
async function createApprovedLeaveWithPassCode(
  studentCookies: Record<string, string>,
  wardenCookies: Record<string, string>,
) {
  const createRes = await request(app)
    .post('/api/leaves')
    .set('Origin', VALID_ORIGIN)
    .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
    .send({
      type: 'DAY_OUTING',
      startDate: futureDate(1),
      endDate: futureDate(1),
      reason: 'Need to buy supplies from market',
    });

  expect(createRes.status).toBe(201);
  const leaveId = createRes.body.data.leave._id;

  const approveRes = await request(app)
    .patch(`/api/leaves/${leaveId}/approve`)
    .set('Origin', VALID_ORIGIN)
    .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

  expect(approveRes.status).toBe(200);
  expect(approveRes.body.data.gatePass).toBeDefined();

  return {
    leaveId,
    passCode: approveRes.body.data.gatePass.passCode as string,
    gatePassId: approveRes.body.data.gatePass._id as string,
  };
}

// ─── POST /api/gate/validate ────────────────────────────────────────────────

describe('POST /api/gate/validate', () => {
  it('returns ALLOW verdict with valid passCode on APPROVED leave', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const { passCode } = await createApprovedLeaveWithPassCode(studentCookies, wardenCookies);

    const res = await request(app)
      .post('/api/gate/validate')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({ passCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verdict).toBe('ALLOW');
    expect(res.body.data.scanResult).toBe('VALID');
    expect(res.body.data.student).toBeDefined();
    expect(res.body.data.leaveType).toBe('DAY_OUTING');
  });

  it('returns DENY verdict with invalid passCode', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const res = await request(app)
      .post('/api/gate/validate')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({ passCode: 'INVALID-CODE-999' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verdict).toBe('DENY');
    expect(res.body.data.scanResult).toBe('NOT_FOUND');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/gate/validate')
      .set('Origin', VALID_ORIGIN)
      .send({ passCode: 'SOME-CODE' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for STUDENT role', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .post('/api/gate/validate')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({ passCode: 'SOME-CODE' });

    expect(res.status).toBe(403);
  });
});

// ─── POST /api/gate/override ────────────────────────────────────────────────

describe('POST /api/gate/override', () => {
  it('creates an override with valid body as GUARD', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const res = await request(app)
      .post('/api/gate/override')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({
        reason: 'Student forgot pass but is known resident',
        note: 'Verified identity manually via ID card',
        method: 'MANUAL_OVERRIDE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overrideId).toBeDefined();
    expect(res.body.data.verdict).toBe('ALLOW');
    expect(res.body.data.scanResult).toBe('OVERRIDE');
  });

  it('returns 400 when note is too short', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const res = await request(app)
      .post('/api/gate/override')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({
        reason: 'Emergency',
        note: 'Hi',
        method: 'MANUAL_OVERRIDE',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/gate/analytics ────────────────────────────────────────────────

describe('GET /api/gate/analytics', () => {
  it('returns today scan stats for GUARD', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const res = await request(app)
      .get('/api/gate/analytics')
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalScans: expect.any(Number),
      allowCount: expect.any(Number),
      denyCount: expect.any(Number),
      avgLatencyMs: expect.any(Number),
    });
    expect(Array.isArray(res.body.data.hourlyDistribution)).toBe(true);
    expect(res.body.data.hourlyDistribution).toHaveLength(24);
  });

  it('reflects a scan performed earlier in the same test', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const { passCode } = await createApprovedLeaveWithPassCode(studentCookies, wardenCookies);

    // Perform a valid scan (ALLOW) — this transitions leave to SCANNED_OUT
    await request(app)
      .post('/api/gate/validate')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({ passCode });

    const res = await request(app)
      .get('/api/gate/analytics')
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.totalScans).toBeGreaterThanOrEqual(1);
    expect(res.body.data.allowCount).toBeGreaterThanOrEqual(1);
  });
});

// ─── GET /api/gate/overrides ────────────────────────────────────────────────

describe('GET /api/gate/overrides', () => {
  it('returns list of overrides as WARDEN', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    // Create an override first
    await request(app)
      .post('/api/gate/override')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({
        reason: 'Emergency exit for medical reasons',
        note: 'Student had medical emergency, allowed through',
        method: 'MANUAL_OVERRIDE',
      });

    const res = await request(app)
      .get('/api/gate/overrides')
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].reason).toBe('Emergency exit for medical reasons');
  });

  it('returns 403 for GUARD role', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const res = await request(app)
      .get('/api/gate/overrides')
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`]);

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/gate/my-scans ────────────────────────────────────────────────

describe('GET /api/gate/my-scans', () => {
  it('returns scans for the authenticated student', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const { passCode } = await createApprovedLeaveWithPassCode(studentCookies, wardenCookies);

    // Guard scans the student out
    await request(app)
      .post('/api/gate/validate')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`])
      .send({ passCode });

    const res = await request(app)
      .get('/api/gate/my-scans')
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.scans)).toBe(true);
    expect(res.body.data.scans.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.scans[0]).toMatchObject({
      verdict: 'ALLOW',
      directionUsed: 'EXIT',
    });
  });

  it('returns empty array when student has no scans', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .get('/api/gate/my-scans')
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.scans).toEqual([]);
  });

  it('returns 403 for GUARD role', async () => {
    const guardCookies = await loginAs('GUARD', 'guard@example.com');

    const res = await request(app)
      .get('/api/gate/my-scans')
      .set('Cookie', [`accessToken=${guardCookies.accessToken}`]);

    expect(res.status).toBe(403);
  });
});
