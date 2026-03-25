import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Student flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'student');
  });

  /* ── Complaints ──────────────────────────────────────────────── */

  test('student can view complaints on status page', async ({ page }) => {
    await expect(page).toHaveURL('/student/status');
    // Status page should load without crashing
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('student can submit a complaint', async ({ page }) => {
    await page.goto('/student/actions/report-issue');
    await expect(page.getByText('Report an Issue')).toBeVisible();

    // Fill in complaint form
    await page.locator('select').selectOption('PLUMBING');
    await page.locator('textarea').fill('The bathroom sink is leaking badly and needs urgent repair');
    await page.getByRole('button', { name: 'Submit Complaint' }).click();

    // Should show success state
    await expect(page.getByText('Issue Reported Successfully')).toBeVisible({ timeout: 10_000 });
  });

  /* ── Mess menu ───────────────────────────────────────────────── */

  test('student can view mess menu', async ({ page }) => {
    await page.goto('/student/mess-menu');
    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    // Should show meal-related content (heading, day names, or meal labels)
    await expect(
      page.getByText(/breakfast|lunch|dinner|mess menu/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  /* ── Leave request ───────────────────────────────────────────── */

  test('student can request leave', async ({ page }) => {
    await page.goto('/student/actions/request-leave');
    await expect(page.getByText(/Request Leave/i)).toBeVisible();

    // Fill in leave form
    await page.locator('select').selectOption('DAY_OUTING');

    // Set dates to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(dateStr);
    await dateInputs.nth(1).fill(dateStr);

    await page.locator('textarea').fill('Family function to attend');
    await page.getByRole('button', { name: /Submit|Request/i }).click();

    // Should show success state
    await expect(page.getByText(/success|submitted|requested/i)).toBeVisible({ timeout: 10_000 });
  });
});
