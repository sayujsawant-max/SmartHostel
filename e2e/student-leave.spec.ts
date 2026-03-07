import { test, expect } from '@playwright/test';
import { login } from './helpers';

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
});
