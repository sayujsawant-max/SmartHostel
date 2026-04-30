import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as paymentController from '@controllers/payment.controller.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(Role.STUDENT));

/**
 * @openapi
 * /payments/payable:
 *   get:
 *     tags: [Payments]
 *     summary: List the current student's UNPAID/OVERDUE fees
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Array of payable fees }
 */
router.get('/payable', paymentController.getPayable);

/**
 * @openapi
 * /payments/history:
 *   get:
 *     tags: [Payments]
 *     summary: List the current student's successful payments
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Array of paid Payment records }
 */
router.get('/history', paymentController.getHistory);

/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Razorpay order for a fee
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feeId]
 *             properties:
 *               feeId: { type: string }
 *     responses:
 *       200: { description: Razorpay order details + public keyId }
 *       503: { description: Payments not configured }
 */
router.post('/create-order', paymentController.createOrder);

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify a Razorpay payment signature and mark the fee paid
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Payment verified }
 *       400: { description: Signature mismatch }
 */
router.post('/verify', paymentController.verify);

export default router;
