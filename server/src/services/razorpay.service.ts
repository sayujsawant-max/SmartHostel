import crypto from 'node:crypto';
import { logger } from '@utils/logger.js';
import { AppError } from '@utils/app-error.js';

interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
}

const RAZORPAY_API = 'https://api.razorpay.com/v1';

/**
 * Create an order via Razorpay's REST API. Amount must be in the smallest
 * currency unit (paise for INR).
 */
export async function createOrder(
  creds: RazorpayCredentials,
  params: { amount: number; currency: string; receipt: string },
): Promise<RazorpayOrder> {
  if (!creds.keyId || !creds.keySecret) {
    throw new AppError('PAYMENTS_NOT_CONFIGURED', 'Razorpay keys are not configured', 503);
  }

  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      payment_capture: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'Razorpay create-order failed');
    throw new AppError('PAYMENT_GATEWAY_ERROR', `Razorpay error: ${res.status}`, 502);
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify the HMAC SHA-256 signature returned by Razorpay Checkout.
 * See https://razorpay.com/docs/payments/server-integration/nodejs/payment-flow/#verify-payment-signature.
 */
export function verifySignature(
  keySecret: string,
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!keySecret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  // Constant-time compare to avoid timing oracles.
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
