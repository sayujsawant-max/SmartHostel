import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import { Resource } from '@models/resource.model.js';
import { ResourceBooking } from '@models/resource-booking.model.js';
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

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dateNDaysFromNow(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

const VALID_RESOURCE = {
  key: 'YOGA',
  label: 'Yoga Session',
  description: 'Evening yoga in the common room',
  slots: [
    { dayOfWeek: 1, startTime: '18:00', durationMinutes: 60 }, // Monday
    { dayOfWeek: 3, startTime: '18:00', durationMinutes: 60 }, // Wednesday
  ],
  capacity: 2,
  allowedRoles: ['STUDENT'],
  bookingWindowDays: 14,
};

describe('Admin resources — RBAC', () => {
  it('POST /api/admin/resources returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/admin/resources')
      .set('Origin', VALID_ORIGIN)
      .send(VALID_RESOURCE);
    expect(res.status).toBe(401);
  });

  it('POST /api/admin/resources returns 403 for STUDENT', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');
    const res = await request(app)
      .post('/api/admin/resources')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_RESOURCE);
    expect(res.status).toBe(403);
  });

  it('warden can create, list, update, delete a resource', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const createRes = await request(app)
      .post('/api/admin/resources')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_RESOURCE);
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.resource.key).toBe('YOGA');

    const listRes = await request(app)
      .get('/api/admin/resources')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);
    expect(listRes.body.data.resources).toHaveLength(1);

    const updateRes = await request(app)
      .patch('/api/admin/resources/YOGA')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ capacity: 20 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.resource.capacity).toBe(20);

    const deleteRes = await request(app)
      .delete('/api/admin/resources/YOGA')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);
    expect(deleteRes.status).toBe(200);
    expect(await Resource.countDocuments({})).toBe(0);
  });

  it('rejects duplicate key', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');
    await request(app)
      .post('/api/admin/resources')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_RESOURCE);
    const res = await request(app)
      .post('/api/admin/resources')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_RESOURCE);
    expect(res.status).toBe(409);
  });

  it('rejects invalid slot time format', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');
    const res = await request(app)
      .post('/api/admin/resources')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ ...VALID_RESOURCE, slots: [{ dayOfWeek: 1, startTime: '6 PM', durationMinutes: 60 }] });
    expect(res.status).toBe(400);
  });
});

describe('Public resource read', () => {
  it('GET /api/resources lists only active resources', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });
    await Resource.create({ ...VALID_RESOURCE, key: 'GYM', isActive: false });

    const res = await request(app).get('/api/resources');
    expect(res.status).toBe(200);
    expect(res.body.data.resources).toHaveLength(1);
    expect(res.body.data.resources[0].key).toBe('YOGA');
  });

  it('GET /api/resources/:key/slots returns slots matching the day-of-week with seat counts', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });

    // Find a Monday in the booking window
    const date = dateNDaysFromNow(0);
    while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
    const dateStr = isoDate(date);

    const res = await request(app).get(`/api/resources/YOGA/slots?date=${dateStr}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slots).toHaveLength(1);
    expect(res.body.data.slots[0]).toMatchObject({
      slotIndex: 0,
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '19:00',
      capacity: 2,
      bookedCount: 0,
      available: 2,
    });
  });

  it('returns empty slots on a day with no template match', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });

    // Find a Tuesday — the resource has no Tuesday slots
    const date = dateNDaysFromNow(0);
    while (date.getDay() !== 2) date.setDate(date.getDate() + 1);
    const res = await request(app).get(`/api/resources/YOGA/slots?date=${isoDate(date)}`);
    expect(res.body.data.slots).toEqual([]);
  });

  it('rejects bad date format', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });
    const res = await request(app).get('/api/resources/YOGA/slots?date=tomorrow');
    expect(res.status).toBe(400);
  });
});

describe('Booking flow', () => {
  async function setupYogaForMonday() {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });
    const date = dateNDaysFromNow(0);
    while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
    return isoDate(date);
  }

  it('student can book a future slot', async () => {
    const dateStr = await setupYogaForMonday();
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.startTime).toBe('18:00');

    const slotsRes = await request(app).get(`/api/resources/YOGA/slots?date=${dateStr}`);
    expect(slotsRes.body.data.slots[0].available).toBe(1);
  });

  it('rejects past dates', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });
    const cookies = await loginAs('STUDENT', 'student@example.com');

    // Yesterday — pick whatever day-of-week to satisfy slot[0] check too
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const res = await request(app)
      .post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: isoDate(past), slotIndex: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects dates beyond bookingWindowDays', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA', bookingWindowDays: 2 });
    const cookies = await loginAs('STUDENT', 'student@example.com');

    // 30 days out, find next Monday from there
    const far = new Date();
    far.setDate(far.getDate() + 30);
    while (far.getDay() !== 1) far.setDate(far.getDate() + 1);

    const res = await request(app)
      .post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: isoDate(far), slotIndex: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects slot that does not run on the requested day', async () => {
    await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });
    const cookies = await loginAs('STUDENT', 'student@example.com');

    // Find a Tuesday — slot 0 is Monday only
    const tuesday = dateNDaysFromNow(0);
    while (tuesday.getDay() !== 2) tuesday.setDate(tuesday.getDate() + 1);

    const res = await request(app)
      .post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: isoDate(tuesday), slotIndex: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 409 when slot is full', async () => {
    const dateStr = await setupYogaForMonday();
    // capacity is 2 — fill with 2 different students
    const c1 = await loginAs('STUDENT', 'a@example.com');
    const c2 = await loginAs('STUDENT', 'b@example.com');
    const c3 = await loginAs('STUDENT', 'c@example.com');

    await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${c1.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${c2.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });

    const fullRes = await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${c3.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    expect(fullRes.status).toBe(409);
  });

  it('rejects double-booking the same slot by the same user', async () => {
    const dateStr = await setupYogaForMonday();
    const cookies = await loginAs('STUDENT', 'student@example.com');

    await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    const dup = await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    expect(dup.status).toBe(409);
  });

  it('rejects users whose role is not allowed', async () => {
    await Resource.create({
      ...VALID_RESOURCE,
      key: 'WARDEN_ONLY_RESOURCE',
      allowedRoles: ['WARDEN_ADMIN'],
    });
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const date = dateNDaysFromNow(0);
    while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
    const res = await request(app).post('/api/resources/WARDEN_ONLY_RESOURCE/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: isoDate(date), slotIndex: 0 });
    expect(res.status).toBe(403);
  });

  it('user can list their bookings and cancel their own', async () => {
    const dateStr = await setupYogaForMonday();
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const bookRes = await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    const bookingId = bookRes.body.data.booking.bookingId;

    const listRes = await request(app).get('/api/resource-bookings/me')
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);
    expect(listRes.body.data.bookings).toHaveLength(1);

    const cancelRes = await request(app).delete(`/api/resource-bookings/${bookingId}`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`]);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.booking.status).toBe('CANCELLED');

    // After cancel, the slot's available count should go back up
    const slotsRes = await request(app).get(`/api/resources/YOGA/slots?date=${dateStr}`);
    expect(slotsRes.body.data.slots[0].available).toBe(2);
  });

  it('rejects cancelling someone else\'s booking', async () => {
    const dateStr = await setupYogaForMonday();
    const c1 = await loginAs('STUDENT', 'owner@example.com');
    const c2 = await loginAs('STUDENT', 'attacker@example.com');

    const bookRes = await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${c1.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });
    const bookingId = bookRes.body.data.booking.bookingId;

    const cancelRes = await request(app).delete(`/api/resource-bookings/${bookingId}`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${c2.accessToken}`]);
    expect(cancelRes.status).toBe(403);
  });
});

describe('Resource deletion cancels future bookings', () => {
  it('soft-cancels future confirmed bookings when resource is deleted', async () => {
    const dateStr = await (async () => {
      await Resource.create({ ...VALID_RESOURCE, key: 'YOGA' });
      const d = dateNDaysFromNow(0);
      while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
      return isoDate(d);
    })();

    const studentCookies = await loginAs('STUDENT', 'student@example.com');
    const wardenCookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    await request(app).post('/api/resources/YOGA/book')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${studentCookies.accessToken}`])
      .send({ date: dateStr, slotIndex: 0 });

    expect(await ResourceBooking.countDocuments({ status: 'CONFIRMED' })).toBe(1);

    await request(app).delete('/api/admin/resources/YOGA')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${wardenCookies.accessToken}`]);

    expect(await ResourceBooking.countDocuments({ status: 'CONFIRMED' })).toBe(0);
    expect(await ResourceBooking.countDocuments({ status: 'CANCELLED' })).toBe(1);
  });
});
