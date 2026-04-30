import { test, expect, type APIRequestContext } from '@playwright/test';
import { login, loginViaApi, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD } from './helpers';

const API_BASE = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

/**
 * Set up a yoga resource via the warden API once per file. Using beforeAll
 * (not beforeEach) keeps the number of login attempts low so we don't trip
 * account lockout if a previous run left bad state.
 */
async function createYogaResource(request: APIRequestContext) {
  const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);

  // Slot every weekday so any test day has at least one bookable slot in the next 7 days
  const slots = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '18:00',
    durationMinutes: 60,
  }));

  // Idempotent: delete any leftover from a previous run, then create fresh.
  await request.delete(`${API_BASE}/admin/resources/YOGA_E2E`, {
    headers: { cookie: cookies, Origin: ORIGIN },
  });

  const res = await request.post(`${API_BASE}/admin/resources`, {
    headers: { cookie: cookies, Origin: ORIGIN },
    data: {
      key: 'YOGA_E2E',
      label: 'Evening Yoga (E2E)',
      description: 'E2E test fixture',
      slots,
      capacity: 5,
      allowedRoles: ['STUDENT'],
      bookingWindowDays: 14,
    },
  });
  expect(res.ok()).toBeTruthy();
}

async function deleteYogaResource(request: APIRequestContext) {
  const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
  await request.delete(`${API_BASE}/admin/resources/YOGA_E2E`, {
    headers: { cookie: cookies, Origin: ORIGIN },
  });
}

test.describe.serial('Resource bookings — student flow', () => {
  test.beforeAll(async ({ request }) => {
    await createYogaResource(request);
  });

  test.afterAll(async ({ request }) => {
    await deleteYogaResource(request);
  });

  test('student sees the warden-created resource on the Bookings page', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student/bookings');

    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
    await expect(page.getByText('Evening Yoga (E2E)')).toBeVisible();

    await page.screenshot({ path: 'test-results/student-bookings-list.png', fullPage: true });
  });

  test('student opens a resource, books a slot, sees it in upcoming, and cancels it', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student/bookings');
    await page.getByText('Evening Yoga (E2E)').click();

    await expect(page.getByRole('heading', { name: /Evening Yoga \(E2E\)/i })).toBeVisible();

    // The resource has a slot every day, so today's chip (first one) should have a Book button.
    const bookButton = page.getByRole('button', { name: 'Book' }).first();
    await expect(bookButton).toBeVisible({ timeout: 8000 });
    await bookButton.click();

    await expect(page.getByText(/Booked!/i)).toBeVisible({ timeout: 8000 });

    // Back to list — upcoming bookings section appears with our entry
    await page.getByRole('button', { name: /All resources/i }).click();
    await expect(page.getByRole('heading', { name: /Your upcoming bookings/i })).toBeVisible();
    await expect(page.getByText('YOGA_E2E')).toBeVisible();

    await page.screenshot({ path: 'test-results/student-bookings-after-book.png', fullPage: true });

    // Cancel — the entry disappears
    await page.getByRole('button', { name: /Cancel booking/i }).click();
    await expect(page.getByText(/Booking cancelled/i)).toBeVisible({ timeout: 8000 });
  });
});
