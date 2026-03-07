import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Student Complaint Filing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'student');
  });

  test('can navigate to report issue page from actions tab', async ({ page }) => {
    await page.getByText('Actions').click();
    await page.waitForURL('/student/actions');
    await page.getByText('Report Issue').click();
    await page.waitForURL('/student/actions/report-issue');
    await expect(page.getByText('Report an Issue')).toBeVisible();
  });

  test('can submit a complaint', async ({ page }) => {
    await page.goto('/student/actions/report-issue');
    await expect(page.getByText('Report an Issue')).toBeVisible();

    await page.locator('select').selectOption('PLUMBING');
    await page.locator('textarea').fill('The bathroom sink is leaking badly and needs urgent repair');
    await page.getByRole('button', { name: 'Submit Complaint' }).click();

    await expect(page.getByText('Issue Reported Successfully')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('complaint has been logged')).toBeVisible();
  });

  test('shows validation error when category not selected', async ({ page }) => {
    await page.goto('/student/actions/report-issue');
    await expect(page.getByText('Report an Issue')).toBeVisible();

    await page.locator('textarea').fill('Some issue description here');
    await page.getByRole('button', { name: 'Submit Complaint' }).click();

    await expect(page.getByText('Please select a category')).toBeVisible();
  });

  test('shows validation error for short description', async ({ page }) => {
    await page.goto('/student/actions/report-issue');
    await expect(page.getByText('Report an Issue')).toBeVisible();

    await page.locator('select').selectOption('ELECTRICAL');
    await page.locator('textarea').fill('Short');
    await page.getByRole('button', { name: 'Submit Complaint' }).click();

    await expect(page.getByText('at least 10 characters')).toBeVisible();
  });

  test('can navigate to status page after successful submission', async ({ page }) => {
    await page.goto('/student/actions/report-issue');
    await expect(page.getByText('Report an Issue')).toBeVisible();

    await page.locator('select').selectOption('GENERAL');
    await page.locator('textarea').fill('Testing complaint submission and navigation flow');
    await page.getByRole('button', { name: 'Submit Complaint' }).click();

    await expect(page.getByText('Issue Reported Successfully')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'View Status' }).click();
    await expect(page).toHaveURL('/student/status');
  });
});
