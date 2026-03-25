import { test, expect } from '@playwright/test';
import { SEED_USERS, login, type SeedRole } from './helpers';

test.describe('Authentication', () => {
  test('shows login page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(login|landing)/);
    await expect(page.getByText('SmartHostel')).toBeVisible();
  });

  for (const [role, user] of Object.entries(SEED_USERS)) {
    test(`${role} can log in and reach their home page`, async ({ page }) => {
      await login(page, role as SeedRole);
      await expect(page).toHaveURL(user.home);
    });
  }

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText(/invalid|not found|unauthorized/i)).toBeVisible({ timeout: 5000 });
  });

  test('student can log out', async ({ page }) => {
    await login(page, 'student');

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('register page is accessible from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Create an account/i).click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('rooms page is publicly accessible', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: 'SmartHostel Rooms' })).toBeVisible();
  });
});
