import { test, expect } from '@playwright/test';
import { SEED_USERS, login, loginAs, type SeedRole } from './helpers';

test.describe('Authentication', () => {
  test('login page loads with form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText(/invalid|not found|unauthorized/i)).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects student to dashboard', async ({ page }) => {
    await login(page, 'student');
    await expect(page).toHaveURL('/student/status');
  });

  test('successful login redirects warden to dashboard', async ({ page }) => {
    await login(page, 'warden');
    await expect(page).toHaveURL('/warden/dashboard');
  });

  test('logout works', async ({ page }) => {
    await login(page, 'student');

    // Look for a logout button — may be in a sidebar or menu
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
    } else if (await logoutLink.isVisible().catch(() => false)) {
      await logoutLink.click();
    } else {
      // Try clicking a user/profile menu first to reveal logout
      const profileBtn = page.locator('[data-testid="user-menu"], [data-testid="profile-menu"]');
      if (await profileBtn.isVisible().catch(() => false)) {
        await profileBtn.click();
        await page.getByText(/logout|sign out/i).click();
      } else {
        // Fallback: click the Logout text anywhere
        await page.getByText(/Logout/i).first().click();
      }
    }

    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('register page is accessible from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/Create an account/i).click();
    await expect(page).toHaveURL('/register');
  });
});
