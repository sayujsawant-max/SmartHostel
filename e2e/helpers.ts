import { type Page, expect } from '@playwright/test';

export const SEED_USERS = {
  student: { email: 'student@smarthostel.dev', password: 'password123', home: '/student/status' },
  warden: { email: 'warden@smarthostel.dev', password: 'password123', home: '/warden/dashboard' },
  guard: { email: 'guard@smarthostel.dev', password: 'password123', home: '/guard/scan' },
  maintenance: { email: 'maintenance@smarthostel.dev', password: 'password123', home: '/maintenance/tasks' },
} as const;

export type SeedRole = keyof typeof SEED_USERS;

export async function login(page: Page, role: SeedRole) {
  const user = SEED_USERS[role];
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(user.home);
}
