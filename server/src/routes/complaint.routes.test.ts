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

async function createComplaintAsStudent(cookies: Record<string, string>) {
  const res = await request(app)
    .post('/api/complaints')
    .set('Origin', VALID_ORIGIN)
    .set('Cookie', [`accessToken=${cookies.accessToken}`])
    .send({
      category: 'PLUMBING',
      description: 'Water leaking from bathroom ceiling pipe',
    });
  return res;
}

describe('POST /api/complaints', () => {
  it('creates a complaint as STUDENT', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await createComplaintAsStudent(cookies);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaint).toMatchObject({
      category: 'PLUMBING',
      description: 'Water leaking from bathroom ceiling pipe',
      status: 'OPEN',
    });
    expect(res.body.correlationId).toBeDefined();
  });

  it('returns 400 for invalid complaint input', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .post('/api/complaints')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ category: 'INVALID', description: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Origin', VALID_ORIGIN)
      .send({ category: 'PLUMBING', description: 'Water leaking from pipe' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for non-STUDENT role', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .post('/api/complaints')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        category: 'ELECTRICAL',
        description: 'Broken light fixture in hallway near room 205',
      });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/complaints', () => {
  it('student sees own complaints only', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');
    await createComplaintAsStudent(cookies);

    const res = await request(app)
      .get('/api/complaints')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.complaints)).toBe(true);
    expect(res.body.data.complaints.length).toBe(1);
  });

  it('warden sees all complaints', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    await createComplaintAsStudent(studentCookies);

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');
    const res = await request(app)
      .get('/api/complaints')
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.complaints.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PATCH /api/complaints/:id/assign', () => {
  it('warden assigns complaint to maintenance staff', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const createRes = await createComplaintAsStudent(studentCookies);
    const complaintId = createRes.body.data.complaint._id;

    // Create a maintenance user
    const maintenanceUser = await User.create({
      name: 'Maintenance Worker',
      email: 'maint@example.com',
      passwordHash,
      role: 'MAINTENANCE',
      isActive: true,
    });

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/assign`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ assigneeId: maintenanceUser._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaint.status).toBe('ASSIGNED');
  });

  it('returns 400 without assigneeId', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const createRes = await createComplaintAsStudent(studentCookies);
    const complaintId = createRes.body.data.complaint._id;

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/assign`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/complaints/:id/priority', () => {
  it('warden updates complaint priority', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const createRes = await createComplaintAsStudent(studentCookies);
    const complaintId = createRes.body.data.complaint._id;

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/priority`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ priority: 'CRITICAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.complaint.priority).toBe('CRITICAL');
  });

  it('returns 400 for invalid priority', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const createRes = await createComplaintAsStudent(studentCookies);
    const complaintId = createRes.body.data.complaint._id;

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/priority`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ priority: 'SUPER_HIGH' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/complaints/:id/status', () => {
  it('maintenance staff updates complaint status to IN_PROGRESS', async () => {
    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const createRes = await createComplaintAsStudent(studentCookies);
    const complaintId = createRes.body.data.complaint._id;

    // Create maintenance user and assign
    const maintenanceUser = await User.create({
      name: 'Maintenance Worker',
      email: 'maint@example.com',
      passwordHash,
      role: 'MAINTENANCE',
      isActive: true,
      hasConsented: true,
    });

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');
    await request(app)
      .patch(`/api/complaints/${complaintId}/assign`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`])
      .send({ assigneeId: maintenanceUser._id.toString() });

    // Login as maintenance
    const maintLoginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', VALID_ORIGIN)
      .send({ email: 'maint@example.com', password: TEST_PASSWORD });
    const maintCookies = extractCookies(maintLoginRes);

    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${maintCookies.accessToken}`])
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.data.complaint.status).toBe('IN_PROGRESS');
  });
});

describe('GET /api/complaints/maintenance-staff', () => {
  it('warden gets list of maintenance staff', async () => {
    await User.create({
      name: 'Maintenance Worker',
      email: 'maint@example.com',
      passwordHash,
      role: 'MAINTENANCE',
      isActive: true,
    });

    const wardenCookies = await loginAs('WARDEN_ADMIN', 'warden@example.com');

    const res = await request(app)
      .get('/api/complaints/maintenance-staff')
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.staff)).toBe(true);
    expect(res.body.data.staff.length).toBeGreaterThanOrEqual(1);
  });
});
