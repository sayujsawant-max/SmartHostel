import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Guard Scan Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'guard');
  });

  test('guard lands on scan page after login', async ({ page }) => {
    await expect(page).toHaveURL('/guard/scan');
  });

  test('guard cannot access student routes', async ({ page }) => {
    await page.goto('/student/status');
    // Should redirect away from student routes
    await expect(page).not.toHaveURL('/student/status', { timeout: 5000 });
  });

  test('guard cannot access warden routes', async ({ page }) => {
    await page.goto('/warden/dashboard');
    await expect(page).not.toHaveURL('/warden/dashboard', { timeout: 5000 });
  });
});
