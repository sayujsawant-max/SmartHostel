import { test, expect } from '@playwright/test';
import {
  login,
  loginViaApi,
  createLeaveViaApi,
  approveLeaveViaApi,
  futureDateISO,
  SEED_USERS,
} from './helpers';

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

test.describe('Guard PassCode Validation', () => {
  let passCode: string;

  test.beforeAll(async ({ request }) => {
    // Student creates a leave, warden approves it — all via API for speed
    const studentCookies = await loginViaApi(
      request,
      SEED_USERS.student.email,
      SEED_USERS.student.password,
    );
    const leave = await createLeaveViaApi(request, studentCookies, {
      type: 'DAY_OUTING',
      startDate: futureDateISO(1),
      endDate: futureDateISO(1),
      reason: 'E2E test — guard passcode validation',
    });

    const wardenCookies = await loginViaApi(
      request,
      SEED_USERS.warden.email,
      SEED_USERS.warden.password,
    );
    passCode = await approveLeaveViaApi(request, wardenCookies, leave._id);
  });

  test('valid passcode shows ALLOW verdict', async ({ page }) => {
    await login(page, 'guard');

    // Switch to Token / PassCode tab
    await page.getByText('Token / PassCode').click();

    // Fill the 6-digit passcode and submit
    const passCodeField = page.locator('input[placeholder="6-digit PassCode"]').last();
    await passCodeField.fill(passCode);
    await passCodeField.press('Enter');

    // Expect the full-screen ALLOW verdict overlay
    await expect(page.getByText('ALLOW')).toBeVisible({ timeout: 10_000 });
  });

  test('invalid passcode shows DENY verdict', async ({ page }) => {
    await login(page, 'guard');

    // Switch to Token / PassCode tab
    await page.getByText('Token / PassCode').click();

    const passCodeField = page.locator('input[placeholder="6-digit PassCode"]').last();
    await passCodeField.fill('000000');
    await passCodeField.press('Enter');

    // Expect the full-screen DENY verdict overlay
    await expect(page.getByText('DENY')).toBeVisible({ timeout: 10_000 });
  });
});
