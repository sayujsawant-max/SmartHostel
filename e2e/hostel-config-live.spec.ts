import { test, expect, type APIRequestContext } from '@playwright/test';
import { login, loginViaApi, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD } from './helpers';

const API_BASE = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

/**
 * Reset the HostelConfig to known defaults at the start and end of each test
 * via the warden API — keeps tests independent and repeatable.
 */
async function resetConfig(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
  await request.patch(`${API_BASE}/hostel-config`, {
    headers: { cookie: cookies, Origin: ORIGIN },
    data: {
      hostel: { name: 'SmartHostel' },
      branding: { primaryColor: '#1e40af', accentColor: '#f59e0b' },
      features: {
        laundry: true, mess: true, gatePass: true, complaints: true, leaves: true,
        notices: true, lostFound: true, sos: true, visitors: true, gamification: true,
        roomMatching: true, wellness: true,
      },
      ...overrides,
    },
  });
}

test.describe('HostelConfig drives the visible site', () => {
  test.beforeEach(async ({ request }) => {
    await resetConfig(request);
  });

  // Reset after every test so subsequent specs in the same Playwright run
  // (which share the same MongoDB) start from a known-good config.
  test.afterEach(async ({ request }) => {
    await resetConfig(request);
  });

  test('hostel name in sidebar reflects HostelConfig.hostel.name', async ({ page, request }) => {
    await resetConfig(request, { hostel: { name: 'Acme University Hostel' } });
    await login(page, 'warden');

    // Sidebar h1 should show the configured name
    await expect(page.locator('aside').getByRole('heading', { name: 'Acme University Hostel' })).toBeVisible();
    await page.screenshot({ path: 'test-results/stage5-hostel-name.png', fullPage: true });
  });

  test('branding primary color writes a fresh --primary onto :root', async ({ page, request }) => {
    await resetConfig(request, { branding: { primaryColor: '#10b981', accentColor: '#f59e0b' } });
    await login(page, 'warden');

    // Wait for the provider to apply branding after auth lands on the dashboard
    await page.waitForURL('/warden/dashboard');

    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    );
    // #10b981 ~ HSL 160 84% 39% (allowing rounding)
    expect(primary).toMatch(/^16\d \d{2,3}% \d{1,3}%$/);
  });

  test('disabling laundry hides the Laundry tab from the student bottom nav', async ({ page, request }) => {
    await resetConfig(request, {
      features: {
        laundry: false, mess: true, gatePass: true, complaints: true, leaves: true,
        notices: true, lostFound: true, sos: true, visitors: true, gamification: true,
        roomMatching: true, wellness: true,
      },
    });
    await login(page, 'student');

    // Bottom nav should NOT contain Laundry
    const nav = page.locator('nav').last();
    await expect(nav.getByRole('link', { name: /Laundry/i })).toHaveCount(0);
    // But Menu (mess) should still be there
    await expect(nav.getByRole('link', { name: /Menu/i })).toBeVisible();
  });

  test('disabling complaints hides the Complaints item from the warden sidebar', async ({ page, request }) => {
    await resetConfig(request, {
      features: {
        laundry: true, mess: true, gatePass: true, complaints: false, leaves: true,
        notices: true, lostFound: true, sos: true, visitors: true, gamification: true,
        roomMatching: true, wellness: true,
      },
    });
    await login(page, 'warden');

    const sidebar = page.locator('aside').first();
    await expect(sidebar.getByRole('link', { name: /^Complaints$/ })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: /^Notices$/ })).toBeVisible();
  });
});
