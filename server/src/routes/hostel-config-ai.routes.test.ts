import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Force the local-fallback path: the service short-circuits when OPENAI_API_KEY is empty.
// vi.mock is hoisted, so this runs before any imports of @config/env.
vi.mock('@config/env.js', async () => {
  const original = await vi.importActual<typeof import('@config/env.js')>('@config/env.js');
  return {
    ...original,
    env: { ...original.env, OPENAI_API_KEY: '' },
  };
});

import { User } from '@models/user.model.js';
import { HostelConfigModel } from '@models/hostel-config.model.js';
import { Resource } from '@models/resource.model.js';
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

async function chat(cookies: Record<string, string>, message: string) {
  return request(app)
    .post('/api/admin/hostel-config-ai/chat')
    .set('Origin', VALID_ORIGIN)
    .set('Cookie', [`accessToken=${cookies.accessToken}`])
    .send({ message, history: [] });
}

describe('POST /api/admin/hostel-config-ai/chat (RBAC)', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/admin/hostel-config-ai/chat')
      .set('Origin', VALID_ORIGIN)
      .send({ message: 'hi', history: [] });
    expect(res.status).toBe(401);
  });

  it('returns 403 for STUDENT', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');
    const res = await chat(cookies, 'hi');
    expect(res.status).toBe(403);
  });

  it('returns 400 on empty message', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');
    const res = await chat(cookies, '');
    expect(res.status).toBe(400);
  });
});

describe('Hostel-config AI — local fallback intent parsing', () => {
  it('"Change AC rooms to 8500" updates all AC roomTypes', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Change AC rooms to 8500');
    expect(res.status).toBe(200);
    expect(res.body.data.actions).toHaveLength(1);
    expect(res.body.data.actions[0].tool).toBe('set_room_type_prices_by_ac');
    expect(res.body.data.actions[0].ok).toBe(true);
    expect(res.body.data.actions[0].args).toEqual({ acType: 'AC', feePerSemester: 8500 });

    // Verify DB
    const config = await HostelConfigModel.findOne({}).lean();
    const acTypes = config!.roomTypes.filter((rt) => rt.acType === 'AC');
    expect(acTypes.length).toBeGreaterThan(0);
    for (const rt of acTypes) expect(rt.feePerSemester).toBe(8500);
    // NON_AC unchanged
    const nonAc = config!.roomTypes.filter((rt) => rt.acType === 'NON_AC');
    for (const rt of nonAc) expect(rt.feePerSemester).not.toBe(8500);
  });

  it('"change non-ac rooms to 6000" updates NON_AC roomTypes', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'change non-ac rooms to 6000');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].args).toEqual({ acType: 'NON_AC', feePerSemester: 6000 });

    const config = await HostelConfigModel.findOne({}).lean();
    for (const rt of config!.roomTypes.filter((rt) => rt.acType === 'NON_AC')) {
      expect(rt.feePerSemester).toBe(6000);
    }
  });

  it('"Rename hostel to Acme University Hostel" updates hostel name', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Rename hostel to Acme University Hostel');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].tool).toBe('update_hostel_info');
    expect(res.body.data.actions[0].args.name).toBe('Acme University Hostel');

    const config = await HostelConfigModel.findOne({}).lean();
    expect(config!.hostel.name).toBe('Acme University Hostel');
  });

  it('"Disable laundry" toggles the laundry feature off', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Disable laundry');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].tool).toBe('toggle_feature');
    expect(res.body.data.actions[0].args).toEqual({ feature: 'laundry', enabled: false });

    const config = await HostelConfigModel.findOne({}).lean();
    expect(config!.features.laundry).toBe(false);
    expect(config!.features.mess).toBe(true); // unchanged
  });

  it('"Enable wellness" turns wellness back on', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    // First disable
    await chat(cookies, 'Disable wellness');
    let config = await HostelConfigModel.findOne({}).lean();
    expect(config!.features.wellness).toBe(false);

    // Then re-enable
    const res = await chat(cookies, 'Enable wellness');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].args).toEqual({ feature: 'wellness', enabled: true });
    config = await HostelConfigModel.findOne({}).lean();
    expect(config!.features.wellness).toBe(true);
  });

  it('"Set primary color to #10b981" updates branding', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Set primary color to #10b981');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].tool).toBe('update_branding');
    expect(res.body.data.actions[0].args).toEqual({ primaryColor: '#10b981' });

    const config = await HostelConfigModel.findOne({}).lean();
    expect(config!.branding.primaryColor).toBe('#10b981');
  });

  it('"Set deposit to 10000" updates security deposit', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Set deposit to 10000');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].args).toEqual({ securityDeposit: 10000 });

    const config = await HostelConfigModel.findOne({}).lean();
    expect(config!.pricing.securityDeposit).toBe(10000);
  });

  it('"change DELUXE_AC to 12500" updates a single roomType', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'change DELUXE_AC to 12500');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].tool).toBe('set_room_type_price');
    expect(res.body.data.actions[0].args).toEqual({ key: 'DELUXE_AC', feePerSemester: 12500 });

    const config = await HostelConfigModel.findOne({}).lean();
    const deluxeAc = config!.roomTypes.find((rt) => rt.key === 'DELUXE_AC');
    expect(deluxeAc!.feePerSemester).toBe(12500);
  });

  it('returns config snapshot in response', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Change AC rooms to 9000');
    expect(res.body.data.config).toBeDefined();
    expect(res.body.data.config.roomTypes).toBeInstanceOf(Array);
    expect(res.body.data.config.hostel.name).toBeDefined();
  });

  it('responds with helpful guidance when no intent matches', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'tell me a joke about hostels');
    expect(res.status).toBe(200);
    expect(res.body.data.actions).toEqual([]);
    expect(res.body.data.reply).toMatch(/AC rooms|disable|primary color|rename/i);
  });

  it('returns the current resources array in every response', async () => {
    await Resource.create({
      key: 'YOGA',
      label: 'Yoga',
      slots: [{ dayOfWeek: 1, startTime: '18:00', durationMinutes: 60 }],
      capacity: 10,
      allowedRoles: ['STUDENT'],
      bookingWindowDays: 14,
      isActive: true,
    });
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'hello');
    expect(res.status).toBe(200);
    expect(res.body.data.resources).toBeInstanceOf(Array);
    expect(res.body.data.resources).toHaveLength(1);
    expect(res.body.data.resources[0].key).toBe('YOGA');
  });
});

describe('Hostel-config AI — resource intents (local fallback)', () => {
  beforeEach(async () => {
    await Resource.create({
      key: 'YOGA',
      label: 'Yoga Session',
      slots: [{ dayOfWeek: 1, startTime: '18:00', durationMinutes: 60 }],
      capacity: 10,
      allowedRoles: ['STUDENT'],
      bookingWindowDays: 14,
      isActive: true,
    });
  });

  it('"Remove resource YOGA" deletes the resource', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Remove resource YOGA');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].tool).toBe('remove_resource');
    expect(res.body.data.actions[0].ok).toBe(true);

    expect(await Resource.countDocuments({})).toBe(0);
    expect(res.body.data.resources).toEqual([]);
  });

  it('"Set YOGA capacity to 25" updates capacity', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Set YOGA capacity to 25');
    expect(res.status).toBe(200);
    expect(res.body.data.actions[0].tool).toBe('set_resource_capacity');
    expect(res.body.data.actions[0].args).toEqual({ key: 'YOGA', capacity: 25 });

    const resource = await Resource.findOne({ key: 'YOGA' }).lean();
    expect(resource!.capacity).toBe(25);
  });

  it('does not match capacity-set when the resource key is unknown', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await chat(cookies, 'Set GHOST capacity to 25');
    expect(res.body.data.actions).toEqual([]);
  });
});
