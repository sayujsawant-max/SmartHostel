import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { User } from '@models/user.model.js';
import { Room } from '@models/room.model.js';
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

describe('GET /api/rooms', () => {
  it('returns 200 with empty array when no rooms', async () => {
    const res = await request(app).get('/api/rooms');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms).toEqual([]);
  });

  it('returns rooms when they exist', async () => {
    await Room.create({
      ...VALID_ROOM_DATA,
      occupiedBeds: 0,
    });

    const res = await request(app).get('/api/rooms');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms).toHaveLength(1);
    expect(res.body.data.rooms[0]).toMatchObject({
      block: 'A',
      floor: '1',
      roomNumber: '101',
      hostelGender: 'BOYS',
    });
  });

  it('filters by hostelGender=BOYS correctly', async () => {
    await Room.create([
      { ...VALID_ROOM_DATA, occupiedBeds: 0 },
      {
        ...VALID_ROOM_DATA,
        roomNumber: '201',
        hostelGender: 'GIRLS',
        occupiedBeds: 0,
      },
    ]);

    const res = await request(app).get('/api/rooms?hostelGender=BOYS');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms).toHaveLength(1);
    expect(res.body.data.rooms[0].hostelGender).toBe('BOYS');
  });
});

describe('GET /api/rooms/availability', () => {
  it('returns availability summary', async () => {
    await Room.create({ ...VALID_ROOM_DATA, occupiedBeds: 2 });

    const res = await request(app).get('/api/rooms/availability');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/rooms/:id', () => {
  it('returns single room by id', async () => {
    const room = await Room.create({ ...VALID_ROOM_DATA, occupiedBeds: 0 });

    const res = await request(app).get(`/api/rooms/${room._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.room.roomNumber).toBe('101');
  });

  it('returns 404 for non-existent room', async () => {
    const fakeId = '000000000000000000000000';
    const res = await request(app).get(`/api/rooms/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/rooms', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .send(VALID_ROOM_DATA);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 201 with WARDEN_ADMIN auth and valid data', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_ROOM_DATA);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.room).toMatchObject({
      block: 'A',
      floor: '1',
      roomNumber: '101',
      hostelGender: 'BOYS',
      roomType: 'DELUXE',
      acType: 'AC',
      totalBeds: 4,
      occupiedBeds: 0,
      feePerSemester: 50000,
    });
  });

  it('returns 403 for STUDENT role', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_ROOM_DATA);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 409 with duplicate block+roomNumber', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    // Create first room
    await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_ROOM_DATA);

    // Try to create duplicate
    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send(VALID_ROOM_DATA);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('PATCH /api/rooms/:id', () => {
  it('updates occupiedBeds with WARDEN_ADMIN auth', async () => {
    const cookies = await loginAs('WARDEN_ADMIN', 'admin@example.com');

    const room = await Room.create({
      ...VALID_ROOM_DATA,
      occupiedBeds: 0,
    });

    const res = await request(app)
      .patch(`/api/rooms/${room._id}`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ occupiedBeds: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.room.occupiedBeds).toBe(2);
  });

  it('returns 403 for STUDENT role', async () => {
    const cookies = await loginAs('STUDENT', 'student@example.com');

    const room = await Room.create({ ...VALID_ROOM_DATA, occupiedBeds: 0 });

    const res = await request(app)
      .patch(`/api/rooms/${room._id}`)
      .set('Origin', VALID_ORIGIN)
      .set('Cookie', [`accessToken=${cookies.accessToken}`])
      .send({ occupiedBeds: 2 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
