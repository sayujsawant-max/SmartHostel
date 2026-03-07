import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import { Leave } from '@models/leave.model.js';
import { GatePass } from '@models/gate-pass.model.js';
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

describe('POST /api/leaves', () => {
  it('creates a leave request as STUDENT', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Going to the market',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leave).toMatchObject({
      type: 'DAY_OUTING',
      status: 'PENDING',
      reason: 'Going to the market',
    });
    expect(res.body.correlationId).toBeDefined();
  });

  it('returns 400 for invalid leave input', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ type: 'INVALID', reason: 'ab' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .send({ type: 'DAY_OUTING', startDate: futureDate(1), endDate: futureDate(1), reason: 'Test' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for non-STUDENT role', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Should be forbidden',
      });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/leaves', () => {
  it('returns student own leaves', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    // Create a leave first
    await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        type: 'OVERNIGHT',
        startDate: futureDate(2),
        endDate: futureDate(3),
        reason: 'Family visit for the weekend',
      });

    const res = await request(app)
      .get('/api/leaves')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.leaves)).toBe(true);
    expect(res.body.data.leaves.length).toBe(1);
    expect(res.body.data.leaves[0].type).toBe('OVERNIGHT');
  });

  it('warden sees all leaves', async () => {
    // Create a student leave first
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Quick errand to pharmacy',
      });

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');
    const res = await request(app)
      .get('/api/leaves')
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.leaves.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PATCH /api/leaves/:id/approve', () => {
  it('warden approves a pending leave and gets gate pass', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');

    const createRes = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Need to buy supplies',
      });

    const leaveId = createRes.body.data.leave._id;
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/approve`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leave.status).toBe('APPROVED');
    expect(res.body.data.gatePass).toBeDefined();
    expect(res.body.data.gatePass.passCode).toBeDefined();
  });
});

describe('PATCH /api/leaves/:id/reject', () => {
  it('warden rejects a pending leave with reason', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');

    const createRes = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({
        type: 'OVERNIGHT',
        startDate: futureDate(1),
        endDate: futureDate(2),
        reason: 'Going home for a function',
      });

    const leaveId = createRes.body.data.leave._id;
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/reject`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ reason: 'Insufficient documentation provided' });

    expect(res.status).toBe(200);
    expect(res.body.data.leave.status).toBe('REJECTED');
  });
});

describe('PATCH /api/leaves/:id/cancel', () => {
  it('student cancels own pending leave', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const createRes = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Changed my plans later',
      });

    const leaveId = createRes.body.data.leave._id;

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/cancel`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.leave.status).toBe('CANCELLED');
  });
});

describe('PATCH /api/leaves/:id/correct', () => {
  it('warden marks leave as corrected with reason', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');

    const createRes = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Errand to the bookshop',
      });

    const leaveId = createRes.body.data.leave._id;

    // correctLeave requires SCANNED_OUT or SCANNED_IN status — set directly in DB
    await Leave.findByIdAndUpdate(leaveId, { status: 'SCANNED_OUT' });

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/correct`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ reason: 'Student returned without scanning, manual correction applied' });

    expect(res.status).toBe(200);
    expect(res.body.data.leave.status).toBe('CORRECTED');
  });

  it('returns 400 when reason is too short', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');

    const createRes = await request(app)
      .post('/api/leaves')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({
        type: 'DAY_OUTING',
        startDate: futureDate(1),
        endDate: futureDate(1),
        reason: 'Another errand to handle',
      });

    const leaveId = createRes.body.data.leave._id;
    await Leave.findByIdAndUpdate(leaveId, { status: 'SCANNED_OUT' });

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/correct`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ reason: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
