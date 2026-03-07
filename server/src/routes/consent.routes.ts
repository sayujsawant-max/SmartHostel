import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import * as consentController from '@controllers/consent.controller.js';

const router = Router();

/**
 * @openapi
 * /consent:
 *   post:
 *     tags: [Consent]
 *     summary: Record user consent acceptance
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version]
 *             properties:
 *               version: { type: string }
 *     responses:
 *       201: { description: Consent recorded }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 */
router.post('/', authMiddleware, consentController.createConsent);

export default router;
