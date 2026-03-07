import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Maintenance Staff', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'maintenance');
  });

  test('maintenance lands on tasks page after login', async ({ page }) => {
    await expect(page).toHaveURL('/maintenance/tasks');
  });

  test('can view tasks page without errors', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to history page', async ({ page }) => {
    await page.getByText('History').click();
    await page.waitForURL('/maintenance/history');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to FAQ page', async ({ page }) => {
    await page.getByText('FAQ').click();
    await page.waitForURL('/maintenance/faq');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('maintenance cannot access warden routes', async ({ page }) => {
    await page.goto('/warden/dashboard');
    await expect(page).not.toHaveURL('/warden/dashboard', { timeout: 5000 });
  });

  test('maintenance cannot access student routes', async ({ page }) => {
    await page.goto('/student/status');
    await expect(page).not.toHaveURL('/student/status', { timeout: 5000 });
  });
});
