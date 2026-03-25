import { type Page, expect } from '@playwright/test';

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
