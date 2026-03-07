import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as gateController from '@controllers/gate.controller.js';
import { passCodeRateLimiter } from '@middleware/passcode-rate-limit.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /gate/validate:
 *   post:
 *     tags: [Gate]
 *     summary: Validate a gate scan via QR token or pass code
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrToken: { type: string }
 *               passCode: { type: string }
 *               directionOverride: { type: string }
 *     responses:
 *       200: { description: Validation result }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - GUARD only }
 *       429: { description: Rate limit exceeded }
 */
router.post('/validate', requireRole(Role.GUARD), passCodeRateLimiter, gateController.validate);

/**
 * @openapi
 * /gate/reconcile:
 *   post:
 *     tags: [Gate]
 *     summary: Reconcile offline gate scans
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Reconciliation result }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - GUARD only }
 */
router.post('/reconcile', requireRole(Role.GUARD), gateController.reconcile);

/**
 * @openapi
 * /gate/override:
 *   post:
 *     tags: [Gate]
 *     summary: Create a manual gate override entry
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Override created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - GUARD only }
 */
router.post('/override', requireRole(Role.GUARD), gateController.override);

/**
 * @openapi
 * /gate/overrides:
 *   get:
 *     tags: [Gate]
 *     summary: List all gate overrides
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of overrides }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/overrides', requireRole(Role.WARDEN_ADMIN), gateController.getOverrides);

/**
 * @openapi
 * /gate/override-stats:
 *   get:
 *     tags: [Gate]
 *     summary: Get override statistics
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Override statistics }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/override-stats', requireRole(Role.WARDEN_ADMIN), gateController.getOverrideStats);

/**
 * @openapi
 * /gate/overrides/{id}/review:
 *   patch:
 *     tags: [Gate]
 *     summary: Review a gate override
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Override reviewed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Override not found }
 */
router.patch('/overrides/:id/review', requireRole(Role.WARDEN_ADMIN), gateController.reviewOverride);

export default router;
