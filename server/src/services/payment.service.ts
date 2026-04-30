import { Types } from 'mongoose';
import { Fee } from '@models/fee.model.js';
import { Payment } from '@models/payment.model.js';
import { getConfigWithSecret } from '@services/hostel-config.service.js';
import * as razorpay from '@services/razorpay.service.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export interface CreateOrderResult {
  paymentId: string;
  orderId: string;
  amount: number;       // Smallest currency unit (paise) — what Razorpay Checkout expects
  currency: string;
  key: string;          // Razorpay public keyId — safe to send to the client
  provider: 'RAZORPAY' | 'MOCK';
}

export async function createOrderForFee(
  studentId: string,
  feeId: string,
): Promise<CreateOrderResult> {
  if (!Types.ObjectId.isValid(feeId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid fee id', 400);
  }
  const fee = await Fee.findById(feeId);
  if (!fee) throw new AppError('NOT_FOUND', 'Fee not found', 404);
  if (fee.studentId.toString() !== studentId) {
    throw new AppError('FORBIDDEN', 'You can only pay your own fees', 403);
  }
  if (fee.status === 'PAID') {
    throw new AppError('VALIDATION_ERROR', 'Fee is already paid', 400);
  }

  const config = await getConfigWithSecret();
  if (!config.payments?.enabled) {
    throw new AppError('PAYMENTS_NOT_CONFIGURED', 'Online payments are not enabled', 503);
  }
  const provider = config.payments.provider;
  if (provider !== 'RAZORPAY' && provider !== 'MOCK') {
    throw new AppError('PAYMENTS_NOT_CONFIGURED', 'Payment provider is not configured', 503);
  }

  const amountPaise = Math.round(fee.amount * 100);
  const receipt = `fee_${fee._id.toString()}`;

  let orderId: string;
  let publicKey = config.payments.keyId || '';

  if (provider === 'MOCK') {
    orderId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    if (!publicKey) publicKey = 'rzp_test_mock';
  } else {
    const order = await razorpay.createOrder(
      { keyId: config.payments.keyId, keySecret: config.payments.keySecret },
      { amount: amountPaise, currency: fee.currency, receipt },
    );
    orderId = order.id;
  }

  const payment = await Payment.create({
    feeId: fee._id,
    studentId: new Types.ObjectId(studentId),
    amount: fee.amount,
    currency: fee.currency,
    status: 'PENDING',
    provider,
    providerOrderId: orderId,
  });

  logger.info(
    { paymentId: payment._id.toString(), feeId, studentId, provider },
    'Payment order created',
  );

  return {
    paymentId: payment._id.toString(),
    orderId,
    amount: amountPaise,
    currency: fee.currency,
    key: publicKey,
    provider,
  };
}

export async function verifyPayment(
  studentId: string,
  body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
): Promise<{ paymentId: string; feeId: string }> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id) {
    throw new AppError('VALIDATION_ERROR', 'Missing payment fields', 400);
  }

  const payment = await Payment.findOne({ providerOrderId: razorpay_order_id });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment record not found', 404);
  if (payment.studentId.toString() !== studentId) {
    throw new AppError('FORBIDDEN', 'Cannot verify another student\'s payment', 403);
  }
  if (payment.status === 'PAID') {
    return { paymentId: payment._id.toString(), feeId: payment.feeId.toString() };
  }

  let verified: boolean;
  if (payment.provider === 'MOCK') {
    verified = true;
  } else {
    const config = await getConfigWithSecret();
    verified = razorpay.verifySignature(
      config.payments?.keySecret ?? '',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
  }

  if (!verified) {
    payment.status = 'FAILED';
    payment.failureReason = 'Signature verification failed';
    payment.signatureVerified = false;
    await payment.save();
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Payment signature is invalid', 400);
  }

  payment.status = 'PAID';
  payment.providerPaymentId = razorpay_payment_id;
  payment.signatureVerified = true;
  payment.paidAt = new Date();
  payment.method = payment.provider === 'MOCK' ? 'mock' : 'card';
  await payment.save();

  await Fee.findByIdAndUpdate(payment.feeId, { status: 'PAID' });

  logger.info(
    { paymentId: payment._id.toString(), feeId: payment.feeId.toString(), studentId },
    'Payment verified and fee marked paid',
  );

  return { paymentId: payment._id.toString(), feeId: payment.feeId.toString() };
}

export async function getStudentPaymentHistory(studentId: string) {
  return Payment.find({ studentId, status: 'PAID' })
    .sort({ paidAt: -1 })
    .populate<{ feeId: { feeType: string; semester: string; academicYear: string } | null }>(
      'feeId',
      'feeType semester academicYear',
    )
    .lean();
}

export async function getStudentPayableFees(studentId: string) {
  return Fee.find({ studentId, status: { $in: ['UNPAID', 'OVERDUE'] } })
    .sort({ dueDate: 1 })
    .lean();
}
