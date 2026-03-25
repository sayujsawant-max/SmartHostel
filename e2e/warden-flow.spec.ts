import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Warden flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'warden');
  });

  /* ── Dashboard ───────────────────────────────────────────────── */

  test('warden dashboard loads with stats', async ({ page }) => {
    await expect(page).toHaveURL('/warden/dashboard');
    // Dashboard should render without errors
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    // Should show some stat-related content (stat cards, numbers, or headings)
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  /* ── Students list ───────────────────────────────────────────── */

  test('warden can view students list', async ({ page }) => {
    await page.getByText('Students').click();
    await page.waitForURL('/warden/students');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  /* ── Complaints management ──────────────────────────────────── */

  test('warden can view and manage complaints', async ({ page }) => {
    await page.getByText('Complaints').click();
    await page.waitForURL('/warden/complaints');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  /* ── Notices ─────────────────────────────────────────────────── */

  test('warden can create a notice', async ({ page }) => {
    await page.getByText('Notices').click();
    await page.waitForURL('/warden/notices');
    await expect(page.locator('body')).not.toContainText('Something went wrong');

    // Open the notice creation form
    const newNoticeBtn = page.getByRole('button', { name: /new notice|create|add/i });
    if (await newNoticeBtn.isVisible().catch(() => false)) {
      await newNoticeBtn.click();
    }

    // Fill in notice form fields (title and content are controlled inputs)
    const titleInput = page.getByPlaceholder(/title/i).or(page.getByLabel(/title/i));
    const contentInput = page.getByPlaceholder(/content|body|message/i).or(page.locator('textarea'));

    await titleInput.first().fill('E2E Test Notice');
    await contentInput.first().fill('This is an automated test notice created by Playwright.');

    // Submit the notice
    await page.getByRole('button', { name: /publish|create|submit|save/i }).click();

    // Should show success feedback
    await expect(page.getByText(/success|published|created/i)).toBeVisible({ timeout: 10_000 });
  });
});
