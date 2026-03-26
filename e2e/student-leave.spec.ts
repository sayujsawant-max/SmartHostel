import { test, expect } from '@playwright/test';
import { login, futureDateISO } from './helpers';

test.describe('Student Leave Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'student');
  });

  test('can navigate to show QR / leave actions', async ({ page }) => {
    await page.getByText('Actions').click();
    await page.waitForURL('/student/actions');
    await expect(page.getByText('Show QR')).toBeVisible();
    await expect(page.getByText('Report Issue')).toBeVisible();
  });

  test('can view status page with leave information', async ({ page }) => {
    await expect(page).toHaveURL('/student/status');
    // Status page should load without errors
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('submit leave request via the UI form', async ({ page }) => {
    await page.goto('/student/actions/request-leave');

    // Fill leave type
    await page.getByText('Leave Type').locator('..').getByRole('combobox').selectOption('DAY_OUTING');

    // Fill start and end dates (tomorrow)
    const tomorrow = futureDateISO(1);
    await page.locator('input[type="date"]').first().fill(tomorrow);
    await page.locator('input[type="date"]').last().fill(tomorrow);

    // Fill reason
    await page.getByPlaceholder('Why do you need leave?').fill('E2E test — submitting leave via UI');

    // Submit
    await page.getByRole('button', { name: /Submit Leave Request/i }).click();

    // Expect the success confirmation
    await expect(page.getByText('Leave Request Submitted')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/pending warden approval/i)).toBeVisible();
  });

  test('view pending leave in leave tracker', async ({ page }) => {
    await page.goto('/student/leave-tracker');

    // The page should load without errors
    await expect(page.getByText('Leave Tracker')).toBeVisible({ timeout: 10_000 });

    // The "Pending" card should be visible (with some count)
    await expect(page.getByText('Pending')).toBeVisible();
  });
});
