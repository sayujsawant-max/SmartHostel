import crypto from 'node:crypto';
import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  loginViaApi,
  TEST_WARDEN_EMAIL,
  TEST_WARDEN_PASSWORD,
  TEST_STUDENT_EMAIL,
  TEST_STUDENT_PASSWORD,
} from './helpers';

const API_BASE = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';

/**
 * Real-Razorpay-test-mode end-to-end. Validates that:
 *   1. Our server's REST call to Razorpay's /v1/orders endpoint succeeds with
 *      the configured Basic auth credentials and returns a real order id.
 *   2. Our HMAC signature math matches Razorpay's documented formula
 *      (the same formula their Checkout uses to sign the response), so
 *      the verify endpoint accepts a correctly-signed payload.
 *   3. A bad signature is rejected with 400.
 *
 * Skipped automatically if RAZORPAY_KEY_ID is missing — keeps CI green for
 * environments without test credentials.
 */
test.describe.serial('Payments — real Razorpay test mode', () => {
  test.skip(
    !KEY_ID || !KEY_SECRET,
    'Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env to run',
  );

  async function configureRazorpay(request: APIRequestContext): Promise<string> {
    const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
    const res = await request.patch(`${API_BASE}/hostel-config`, {
      headers: { cookie: cookies, Origin: ORIGIN },
      data: {
        payments: {
          provider: 'RAZORPAY',
          enabled: true,
          keyId: KEY_ID,
          keySecret: KEY_SECRET,
        },
        features: { payments: true },
      },
    });
    expect(res.ok(), 'enable Razorpay').toBeTruthy();
    return cookies;
  }

  async function disablePayments(request: APIRequestContext): Promise<void> {
    const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
    await request.patch(`${API_BASE}/hostel-config`, {
      headers: { cookie: cookies, Origin: ORIGIN },
      data: { payments: { provider: 'NONE', enabled: false, keyId: '' } },
    });
  }

  async function issueFee(
    request: APIRequestContext,
    wardenCookies: string,
    amount: number,
  ): Promise<string> {
    // Look up the seeded student.
    const studentsRes = await request.get(`${API_BASE}/fees/students`, {
      headers: { cookie: wardenCookies, Origin: ORIGIN },
    });
    const students = (await studentsRes.json()) as {
      data: { students: Array<{ _id: string; email: string }> };
    };
    const student = students.data.students.find((s) => s.email === TEST_STUDENT_EMAIL);
    expect(student).toBeTruthy();

    const due = new Date();
    due.setDate(due.getDate() + 14);
    const res = await request.post(`${API_BASE}/fees`, {
      headers: { cookie: wardenCookies, Origin: ORIGIN },
      data: {
        studentId: student!._id,
        feeType: 'MAINTENANCE_FEE',
        amount,
        dueDate: due.toISOString().split('T')[0],
        semester: 'E2E Razorpay 2026',
        academicYear: '2025-2026',
      },
    });
    expect(res.ok(), 'issue fee').toBeTruthy();
    const body = (await res.json()) as { data: { fee: { _id: string } } };
    return body.data.fee._id;
  }

  test.afterEach(async ({ request }) => {
    await disablePayments(request);
  });

  test('create-order hits Razorpay test API and returns a real order id', async ({ request }) => {
    const wardenCookies = await configureRazorpay(request);
    const uniqueAmount = 99 + Math.floor(Math.random() * 100);
    const feeId = await issueFee(request, wardenCookies, uniqueAmount);

    try {
      const studentCookies = await loginViaApi(
        request,
        TEST_STUDENT_EMAIL,
        TEST_STUDENT_PASSWORD,
      );
      const res = await request.post(`${API_BASE}/payments/create-order`, {
        headers: { cookie: studentCookies, Origin: ORIGIN },
        data: { feeId },
      });
      expect(res.ok(), `create-order: ${await res.text()}`).toBeTruthy();
      const body = (await res.json()) as {
        data: { provider: string; orderId: string; key: string; amount: number; currency: string };
      };

      // Real Razorpay order ids start with `order_`. The MOCK provider would
      // return `order_mock_…` — assert RAZORPAY explicitly.
      expect(body.data.provider).toBe('RAZORPAY');
      expect(body.data.orderId).toMatch(/^order_[A-Za-z0-9]+$/);
      expect(body.data.orderId.startsWith('order_mock_')).toBe(false);
      expect(body.data.key).toBe(KEY_ID);
      expect(body.data.amount).toBe(uniqueAmount * 100);
      expect(body.data.currency).toBe('INR');
    } finally {
      await request.delete(`${API_BASE}/fees/${feeId}`, {
        headers: { cookie: wardenCookies, Origin: ORIGIN },
      });
    }
  });

  test('verify accepts a correctly-signed payload and marks the fee PAID', async ({ request }) => {
    const wardenCookies = await configureRazorpay(request);
    const uniqueAmount = 199 + Math.floor(Math.random() * 100);
    const feeId = await issueFee(request, wardenCookies, uniqueAmount);

    try {
      const studentCookies = await loginViaApi(
        request,
        TEST_STUDENT_EMAIL,
        TEST_STUDENT_PASSWORD,
      );
      const orderRes = await request.post(`${API_BASE}/payments/create-order`, {
        headers: { cookie: studentCookies, Origin: ORIGIN },
        data: { feeId },
      });
      const order = (await orderRes.json()) as { data: { orderId: string } };

      // Razorpay Checkout signs ${orderId}|${paymentId} with the keySecret. We
      // can't actually drive Checkout from a Node process, so we sign with the
      // same formula and a synthetic payment id — proves our server's HMAC
      // matches Razorpay's documented contract.
      const fakePaymentId = `pay_e2e_${Date.now()}`;
      const signature = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${order.data.orderId}|${fakePaymentId}`)
        .digest('hex');

      const verifyRes = await request.post(`${API_BASE}/payments/verify`, {
        headers: { cookie: studentCookies, Origin: ORIGIN },
        data: {
          razorpay_order_id: order.data.orderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: signature,
        },
      });
      expect(verifyRes.ok(), `verify: ${await verifyRes.text()}`).toBeTruthy();

      // Fee should now be PAID — confirm via the warden list.
      const feesRes = await request.get(`${API_BASE}/fees?status=PAID`, {
        headers: { cookie: wardenCookies, Origin: ORIGIN },
      });
      const fees = (await feesRes.json()) as {
        data: { fees: Array<{ _id: string; status: string; amount: number }> };
      };
      const ours = fees.data.fees.find((f) => f._id === feeId);
      expect(ours, 'our fee should be in the PAID list').toBeTruthy();
      expect(ours!.status).toBe('PAID');
      expect(ours!.amount).toBe(uniqueAmount);
    } finally {
      await request.delete(`${API_BASE}/fees/${feeId}`, {
        headers: { cookie: wardenCookies, Origin: ORIGIN },
      });
    }
  });

  test('verify rejects a tampered signature with 400', async ({ request }) => {
    const wardenCookies = await configureRazorpay(request);
    const feeId = await issueFee(request, wardenCookies, 50);

    try {
      const studentCookies = await loginViaApi(
        request,
        TEST_STUDENT_EMAIL,
        TEST_STUDENT_PASSWORD,
      );
      const orderRes = await request.post(`${API_BASE}/payments/create-order`, {
        headers: { cookie: studentCookies, Origin: ORIGIN },
        data: { feeId },
      });
      const order = (await orderRes.json()) as { data: { orderId: string } };

      const verifyRes = await request.post(`${API_BASE}/payments/verify`, {
        headers: { cookie: studentCookies, Origin: ORIGIN },
        data: {
          razorpay_order_id: order.data.orderId,
          razorpay_payment_id: 'pay_tampered',
          razorpay_signature: 'a'.repeat(64),
        },
      });
      expect(verifyRes.status()).toBe(400);
    } finally {
      await request.delete(`${API_BASE}/fees/${feeId}`, {
        headers: { cookie: wardenCookies, Origin: ORIGIN },
      });
    }
  });
});
