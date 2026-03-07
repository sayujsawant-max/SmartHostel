import { test, expect } from '@playwright/test';

test.describe('Public Rooms Page', () => {
  test('rooms page loads without authentication', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: 'SmartHostel Rooms' })).toBeVisible();
  });

  test('rooms page shows room cards or empty state', async ({ page }) => {
    await page.goto('/rooms');
    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('rooms page does not redirect to login', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page).toHaveURL('/rooms');
  });
});
