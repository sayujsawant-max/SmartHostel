import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import { HostelConfigModel } from '@models/hostel-config.model.js';
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

async function loginAs(role: string, email: string) {
  await createTestUser({ role, email, hasConsented: true });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .set('Origin', VALID_ORIGIN)
    .send({ email, password: TEST_PASSWORD });
  return extractCookies(loginRes);
}

describe('GET /api/hostel-config', () => {
  it('is public — no auth required', async () => {
    const res = await request(app).get('/api/hostel-config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('lazy-seeds defaults on first request', async () => {
    expect(await HostelConfigModel.countDocuments({})).toBe(0);

    const res = await request(app).get('/api/hostel-config');

    expect(res.status).toBe(200);
    expect(res.body.data.config.hostel.name).toBe('SmartHostel');
    expect(res.body.data.config.branding.primaryColor).toMatch(/^#/);
    expect(res.body.data.config.roomTypes.length).toBeGreaterThan(0);
    expect(res.body.data.config.features.laundry).toBe(true);
    expect(await HostelConfigModel.countDocuments({})).toBe(1);
  });

  it('returns the same singleton on repeated calls', async () => {
    const first = await request(app).get('/api/hostel-config');
    const second = await request(app).get('/api/hostel-config');
    expect(first.body.data.config._id).toBe(second.body.data.config._id);
    expect(await HostelConfigModel.countDocuments({})).toBe(1);
  });
});

describe('PATCH /api/hostel-config', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .send({ hostel: { name: 'Hacked' } });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ hostel: { name: 'Hacked' } });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('updates hostel info partially with WARDEN_ADMIN', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ hostel: { name: 'Acme Hostel', tagline: 'New tagline' } });

    expect(res.status).toBe(200);
    expect(res.body.data.config.hostel.name).toBe('Acme Hostel');
    expect(res.body.data.config.hostel.tagline).toBe('New tagline');
    // unchanged fields preserved from defaults
    expect(res.body.data.config.branding.primaryColor).toMatch(/^#/);
    expect(res.body.data.config.roomTypes.length).toBeGreaterThan(0);
  });

  it('updates branding colors', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ branding: { primaryColor: '#10b981', accentColor: '#f43f5e' } });

    expect(res.status).toBe(200);
    expect(res.body.data.config.branding.primaryColor).toBe('#10b981');
    expect(res.body.data.config.branding.accentColor).toBe('#f43f5e');
  });

  it('toggles feature flags', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ features: { laundry: false, gamification: false } });

    expect(res.status).toBe(200);
    expect(res.body.data.config.features.laundry).toBe(false);
    expect(res.body.data.config.features.gamification).toBe(false);
    expect(res.body.data.config.features.mess).toBe(true); // unchanged
  });

  it('replaces full roomTypes array', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const newRoomTypes = [
      { key: 'PREMIUM_AC', label: 'Premium AC', acType: 'AC', feePerSemester: 15000, capacity: 1, isActive: true },
      { key: 'PREMIUM_NON_AC', label: 'Premium Non-AC', acType: 'NON_AC', feePerSemester: 11000, capacity: 1, isActive: true },
    ];

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ roomTypes: newRoomTypes });

    expect(res.status).toBe(200);
    expect(res.body.data.config.roomTypes).toHaveLength(2);
    expect(res.body.data.config.roomTypes[0].key).toBe('PREMIUM_AC');
  });

  it('returns 400 on invalid hex color', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ branding: { primaryColor: 'red' } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 on duplicate roomType keys', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        roomTypes: [
          { key: 'A', label: 'A', acType: 'AC', feePerSemester: 100, capacity: 1, isActive: true },
          { key: 'A', label: 'A2', acType: 'NON_AC', feePerSemester: 200, capacity: 1, isActive: true },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('persists updates across requests', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ hostel: { name: 'Persisted Hostel' } });

    const res = await request(app).get('/api/hostel-config');
    expect(res.body.data.config.hostel.name).toBe('Persisted Hostel');
  });
});

describe('Room creation respects HostelConfig roomTypes', () => {
  const VALID_ROOM_DATA = {
    block: 'A',
    floor: '1',
    roomNumber: '101',
    hostelGender: 'BOYS',
    roomType: 'DELUXE',
    acType: 'AC',
    totalBeds: 4,
    feePerSemester: 50000,
  };

  it('allows creating a room whose roomType+acType matches an active config entry', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_ROOM_DATA);

    expect(res.status).toBe(201);
  });

  it('rejects a room whose roomType is not in the config', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ ...VALID_ROOM_DATA, roomType: 'PRESIDENTIAL' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a room when its config entry is deactivated', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    // Deactivate DELUXE_AC by replacing roomTypes with same data but isActive=false
    await request(app)
      .patch('/api/hostel-config')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({
        roomTypes: [
          { key: 'DELUXE_AC', label: 'Deluxe AC', acType: 'AC', feePerSemester: 12000, capacity: 2, isActive: false },
          { key: 'NORMAL_AC', label: 'Normal AC', acType: 'AC', feePerSemester: 8500, capacity: 3, isActive: true },
        ],
      });

    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_ROOM_DATA); // DELUXE + AC → deactivated

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
