import { type Page, type APIRequestContext, expect } from '@playwright/test';

/* ─── Test credentials (must match server seed data) ─────────── */

export const TEST_STUDENT_EMAIL = 'student@smarthostel.dev';
export const TEST_STUDENT_PASSWORD = 'password123';

export const TEST_WARDEN_EMAIL = 'warden@smarthostel.dev';
export const TEST_WARDEN_PASSWORD = 'password123';

export const SEED_USERS = {
  student: { email: TEST_STUDENT_EMAIL, password: TEST_STUDENT_PASSWORD, home: '/student/status' },
  warden: { email: TEST_WARDEN_EMAIL, password: TEST_WARDEN_PASSWORD, home: '/warden/dashboard' },
  guard: { email: 'guard@smarthostel.dev', password: 'password123', home: '/guard/scan' },
  maintenance: { email: 'maintenance@smarthostel.dev', password: 'password123', home: '/maintenance/tasks' },
} as const;

export type SeedRole = keyof typeof SEED_USERS;

/* ─── Login helpers ──────────────────────────────────────────── */

/**
 * Generic login helper — fill email + password and submit.
 * Waits for navigation away from /login before returning.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
}

/**
 * Role-based login helper — looks up seed credentials by role key.
 */
export async function login(page: Page, role: SeedRole) {
  const user = SEED_USERS[role];
  await loginAs(page, user.email, user.password);
  await expect(page).toHaveURL(user.home);
}

/* ─── API-based helpers (faster than UI for setup/teardown) ── */

const API_BASE = 'http://localhost:5000/api';

/**
 * Login via the REST API. Returns the cookie header string
 * (e.g. "accessToken=…; refreshToken=…") for use in subsequent requests.
 */
export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();

  // Extract Set-Cookie headers and flatten into a single cookie string
  const setCookies = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
  const cookies = setCookies
    .map((h) => h.value.split(';')[0]) // take "name=value" portion
    .join('; ');
  expect(cookies).toContain('accessToken');
  return cookies;
}

/**
 * Create a leave request via the API. Returns the created leave object.
 */
export async function createLeaveViaApi(
  request: APIRequestContext,
  cookies: string,
  data: { type: string; startDate: string; endDate: string; reason: string },
): Promise<{ _id: string; status: string; [k: string]: unknown }> {
  const res = await request.post(`${API_BASE}/leaves`, {
    headers: { cookie: cookies },
    data,
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.data.leave;
}

/**
 * Approve a leave request via the API (warden role required).
 * Returns the passCode from the generated gate pass.
 */
export async function approveLeaveViaApi(
  request: APIRequestContext,
  cookies: string,
  leaveId: string,
): Promise<string> {
  const res = await request.patch(`${API_BASE}/leaves/${leaveId}/approve`, {
    headers: { cookie: cookies },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const passCode: string = body.data.gatePass.passCode;
  expect(passCode).toBeTruthy();
  return passCode;
}

/**
 * Helper: compute a future ISO date string (YYYY-MM-DD) offset from today.
 */
export function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}
