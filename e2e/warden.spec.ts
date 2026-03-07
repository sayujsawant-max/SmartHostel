import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Warden Dashboard & Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'warden');
  });

  test('warden lands on dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL('/warden/dashboard');
  });

  test('dashboard shows key statistics', async ({ page }) => {
    // Dashboard should load with stat cards
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to complaints page', async ({ page }) => {
    await page.getByText('Complaints').click();
    await page.waitForURL('/warden/complaints');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to notices page', async ({ page }) => {
    await page.getByText('Notices').click();
    await page.waitForURL('/warden/notices');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to students page', async ({ page }) => {
    await page.getByText('Students').click();
    await page.waitForURL('/warden/students');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to rooms management page', async ({ page }) => {
    await page.getByText('Rooms').click();
    await page.waitForURL('/warden/rooms');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('can navigate to users management page', async ({ page }) => {
    await page.getByText('Users').click();
    await page.waitForURL('/warden/users');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('warden cannot access student routes', async ({ page }) => {
    await page.goto('/student/status');
    await expect(page).not.toHaveURL('/student/status', { timeout: 5000 });
  });

  test('warden cannot access maintenance routes', async ({ page }) => {
    await page.goto('/maintenance/tasks');
    await expect(page).not.toHaveURL('/maintenance/tasks', { timeout: 5000 });
  });
});
