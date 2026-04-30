import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  login,
  loginViaApi,
  TEST_WARDEN_EMAIL,
  TEST_WARDEN_PASSWORD,
  TEST_STUDENT_EMAIL,
  TEST_STUDENT_PASSWORD,
} from './helpers';

const API_BASE = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

/**
 * Configure the hostel to use the MOCK payment provider so the demo runs
 * end-to-end without a real Razorpay account. Returns warden cookies.
 */
async function enableMockPayments(request: APIRequestContext): Promise<string> {
  const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
  const res = await request.patch(`${API_BASE}/hostel-config`, {
    headers: { cookie: cookies, Origin: ORIGIN },
    data: {
      payments: { provider: 'MOCK', enabled: true, keyId: 'rzp_test_mock' },
      features: { payments: true },
    },
  });
  expect(res.ok(), 'enable mock payments').toBeTruthy();
  return cookies;
}

async function disablePayments(request: APIRequestContext): Promise<void> {
  const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
  await request.patch(`${API_BASE}/hostel-config`, {
    headers: { cookie: cookies, Origin: ORIGIN },
    data: { payments: { provider: 'NONE', enabled: false } },
  });
}

async function findStudentId(request: APIRequestContext, wardenCookies: string): Promise<string> {
  const res = await request.get(`${API_BASE}/fees/students`, {
    headers: { cookie: wardenCookies, Origin: ORIGIN },
  });
  expect(res.ok(), 'list students').toBeTruthy();
  const body = (await res.json()) as { data: { students: Array<{ _id: string; email: string }> } };
  const seeded = body.data.students.find((s) => s.email === TEST_STUDENT_EMAIL);
  expect(seeded, `seeded student ${TEST_STUDENT_EMAIL} should exist`).toBeTruthy();
  return seeded!._id;
}

interface IssuedFee {
  _id: string;
  amount: number;
  feeType: string;
}

async function issueFee(
  request: APIRequestContext,
  wardenCookies: string,
  studentId: string,
  amount: number,
): Promise<IssuedFee> {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const res = await request.post(`${API_BASE}/fees`, {
    headers: { cookie: wardenCookies, Origin: ORIGIN },
    data: {
      studentId,
      feeType: 'MAINTENANCE_FEE',
      amount,
      dueDate: due.toISOString().split('T')[0],
      semester: 'E2E Spring 2026',
      academicYear: '2025-2026',
    },
  });
  expect(res.ok(), 'issue fee').toBeTruthy();
  const body = (await res.json()) as { data: { fee: IssuedFee } };
  return body.data.fee;
}

async function deleteFeeIfExists(
  request: APIRequestContext,
  wardenCookies: string,
  feeId: string,
): Promise<void> {
  await request.delete(`${API_BASE}/fees/${feeId}`, {
    headers: { cookie: wardenCookies, Origin: ORIGIN },
  });
}

test.describe.serial('Payments — warden issues fee, student pays via mock provider', () => {
  test.afterEach(async ({ request }) => {
    await disablePayments(request);
  });

  test('full flow: issue → student sees pending → pay → fee disappears → history shows', async ({
    page,
    request,
  }) => {
    const wardenCookies = await enableMockPayments(request);
    const studentId = await findStudentId(request, wardenCookies);
    // Use a unique amount so we can target the row even if other fees exist.
    const uniqueAmount = 1234 + Math.floor(Math.random() * 1000);
    const fee = await issueFee(request, wardenCookies, studentId, uniqueAmount);

    try {
      await login(page, 'student');
      await page.goto('/student/payments');

      const amountText = `₹${uniqueAmount.toLocaleString('en-IN')}`;
      // Scope to OUR fee's card via the unique semester label we issued it with.
      // Otherwise the list (sorted by due date) puts seed fees first and the
      // generic "Pay Now" locator picks the wrong row.
      const ourCard = page.locator('.card-glow', { hasText: 'E2E Spring 2026' });
      await expect(ourCard).toBeVisible({ timeout: 10_000 });
      await expect(ourCard).toContainText(amountText);

      await page.screenshot({ path: 'test-results/payments-pending.png', fullPage: true });

      await ourCard.getByRole('button', { name: /Pay Now/i }).click();

      // MOCK provider verifies server-side without opening Razorpay Checkout.
      await expect(page.getByText(/Payment successful/i)).toBeVisible({ timeout: 10_000 });

      // Our specific card is gone from pending.
      await expect(ourCard).toHaveCount(0, { timeout: 5_000 });

      // Switch to History tab and verify our payment is recorded.
      await page.getByRole('button', { name: /^History/ }).click();
      await expect(page.locator(`text=${amountText}`).first()).toBeVisible({ timeout: 5_000 });

      await page.screenshot({ path: 'test-results/payments-history.png', fullPage: true });
    } finally {
      await deleteFeeIfExists(request, wardenCookies, fee._id);
    }
  });

  test('warden Fees page lists newly issued fee with student name', async ({ page, request }) => {
    const wardenCookies = await enableMockPayments(request);
    const studentId = await findStudentId(request, wardenCookies);
    const uniqueAmount = 7890 + Math.floor(Math.random() * 1000);
    const fee = await issueFee(request, wardenCookies, studentId, uniqueAmount);

    try {
      await login(page, 'warden');
      await page.goto('/warden/fees');
      await expect(page.getByRole('heading', { name: 'Fees' })).toBeVisible();
      // Filter by UNPAID so paid seed fees don't crowd the page.
      await page.getByRole('button', { name: /^UNPAID$/ }).click();
      await expect(page.locator(`text=₹${uniqueAmount.toLocaleString('en-IN')}`).first()).toBeVisible({
        timeout: 10_000,
      });
      await page.screenshot({ path: 'test-results/warden-fees.png', fullPage: true });
    } finally {
      await deleteFeeIfExists(request, wardenCookies, fee._id);
    }
  });

  test('without configured provider, create-order returns 503', async ({ request }) => {
    // Don't call enableMockPayments — leave it at NONE/disabled.
    const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
    await request.patch(`${API_BASE}/hostel-config`, {
      headers: { cookie: cookies, Origin: ORIGIN },
      data: { payments: { provider: 'NONE', enabled: false } },
    });
    const studentId = await findStudentId(request, cookies);
    const fee = await issueFee(request, cookies, studentId, 555);
    try {
      const studentCookies = await loginViaApi(
        request,
        TEST_STUDENT_EMAIL,
        TEST_STUDENT_PASSWORD,
      );
      const res = await request.post(`${API_BASE}/payments/create-order`, {
        headers: { cookie: studentCookies, Origin: ORIGIN },
        data: { feeId: fee._id },
      });
      expect(res.status()).toBe(503);
    } finally {
      await deleteFeeIfExists(request, cookies, fee._id);
    }
  });
});
