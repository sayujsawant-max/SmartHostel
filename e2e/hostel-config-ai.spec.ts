import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Hostel Config AI chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'warden');
    await page.goto('/warden/hostel-config');
    await expect(page.getByRole('heading', { name: /Hostel Configuration/i })).toBeVisible();
  });

  test('chat panel renders with suggestion chips', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI admin' })).toBeVisible();
    await expect(page.getByPlaceholder(/Change AC rooms to/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Change AC rooms to 8500/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Disable laundry/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/hostel-config-ai-chat-empty.png', fullPage: true });
  });

  test('"Change AC rooms to 8500" updates the roomTypes table in-place', async ({ page }) => {
    // Verify starting state — DELUXE_AC default fee is 12000
    const deluxeAcRow = page.locator('input[value="DELUXE_AC"]').first().locator('xpath=ancestor::tr');
    await expect(deluxeAcRow.locator('input[type="number"]').first()).toHaveValue('12000');

    // Type the prompt and send
    await page.getByPlaceholder(/Change AC rooms to/i).fill('Change AC rooms to 8500');
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for the assistant turn to appear with at least one applied action
    await expect(page.getByText(/set_room_type_prices_by_ac/i)).toBeVisible({ timeout: 20_000 });

    // The table should now reflect 8500 on AC rooms (state was updated by onConfigChange)
    await expect(deluxeAcRow.locator('input[type="number"]').first()).toHaveValue('8500');
    const normalAcRow = page.locator('input[value="NORMAL_AC"]').first().locator('xpath=ancestor::tr');
    await expect(normalAcRow.locator('input[type="number"]').first()).toHaveValue('8500');

    // NON_AC rows unchanged
    const deluxeNonAc = page.locator('input[value="DELUXE_NON_AC"]').first().locator('xpath=ancestor::tr');
    await expect(deluxeNonAc.locator('input[type="number"]').first()).toHaveValue('9000');

    await page.screenshot({ path: 'test-results/hostel-config-ai-after-prompt.png', fullPage: true });

    // Reload to confirm persistence
    await page.reload();
    const reloadedRow = page.locator('input[value="DELUXE_AC"]').first().locator('xpath=ancestor::tr');
    await expect(reloadedRow.locator('input[type="number"]').first()).toHaveValue('8500');
  });

  test('clicking a suggestion chip sends the prompt', async ({ page }) => {
    await page.getByRole('button', { name: /Disable laundry/i }).click();

    // Wait for confirmation toggle action
    await expect(page.getByText(/toggle_feature/i)).toBeVisible({ timeout: 20_000 });

    // Laundry checkbox should now be unchecked
    await expect(page.locator('label:has-text("Laundry") input[type="checkbox"]')).not.toBeChecked();

    // Re-enable for cleanup
    await page.getByPlaceholder(/Change AC rooms to/i).fill('Enable laundry');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('label:has-text("Laundry") input[type="checkbox"]')).toBeChecked({ timeout: 20_000 });
  });
});
