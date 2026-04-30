import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Warden Hostel Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'warden');
  });

  test('sidebar shows Hostel Config link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Hostel Config/i })).toBeVisible();
  });

  test('page loads with seeded defaults and persists edits', async ({ page }) => {
    await page.getByRole('link', { name: /Hostel Config/i }).click();
    await page.waitForURL('/warden/hostel-config');

    // Hero header
    await expect(page.getByRole('heading', { name: /Hostel Configuration/i })).toBeVisible();

    // Section headings
    await expect(page.getByRole('heading', { name: 'Hostel info' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Branding' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Room types' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Blocks' })).toBeVisible();

    // Default seeded room type keys should be present in the table inputs
    await expect(page.locator('input[value="DELUXE_AC"]')).toBeVisible();
    await expect(page.locator('input[value="NORMAL_AC"]')).toBeVisible();

    // Capture initial state
    await page.screenshot({ path: 'test-results/hostel-config-loaded.png', fullPage: true });

    // Edit hostel name to a distinct value
    const newName = `E2E Hostel ${Date.now()}`;
    const nameInput = page.locator('label:has-text("Name") + input').first();
    await nameInput.fill(newName);

    // Save
    await page.getByRole('button', { name: /Save changes/i }).click();

    // Wait for success toast
    await expect(page.getByText(/Hostel configuration saved/i)).toBeVisible({ timeout: 8000 });

    // Reload the page and verify persistence
    await page.reload();
    await expect(page.locator('label:has-text("Name") + input').first()).toHaveValue(newName);

    await page.screenshot({ path: 'test-results/hostel-config-after-save.png', fullPage: true });
  });

  test('updating an AC roomType price persists', async ({ page }) => {
    await page.goto('/warden/hostel-config');

    // Find the row for NORMAL_AC and update its fee
    const normalAcKey = page.locator('input[value="NORMAL_AC"]').first();
    await expect(normalAcKey).toBeVisible();
    const normalAcRow = normalAcKey.locator('xpath=ancestor::tr');
    const feeInput = normalAcRow.locator('input[type="number"]').first();
    await feeInput.fill('8500');

    await page.getByRole('button', { name: /Save changes/i }).click();
    await expect(page.getByText(/Hostel configuration saved/i)).toBeVisible({ timeout: 8000 });

    await page.reload();
    const reloadedRow = page.locator('input[value="NORMAL_AC"]').first().locator('xpath=ancestor::tr');
    await expect(reloadedRow.locator('input[type="number"]').first()).toHaveValue('8500');
  });

  test('toggling a feature flag persists', async ({ page }) => {
    await page.goto('/warden/hostel-config');

    const laundryToggle = page.locator('label:has-text("Laundry") input[type="checkbox"]');
    await expect(laundryToggle).toBeChecked();
    await laundryToggle.uncheck();

    await page.getByRole('button', { name: /Save changes/i }).click();
    await expect(page.getByText(/Hostel configuration saved/i)).toBeVisible({ timeout: 8000 });

    await page.reload();
    await expect(page.locator('label:has-text("Laundry") input[type="checkbox"]')).not.toBeChecked();

    // Reset for other tests
    await page.locator('label:has-text("Laundry") input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Save changes/i }).click();
    await expect(page.getByText(/Hostel configuration saved/i)).toBeVisible({ timeout: 8000 });
  });
});
