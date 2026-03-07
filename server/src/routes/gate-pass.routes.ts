import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as gatePassController from '@controllers/gate-pass.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /gate-passes/active:
 *   get:
 *     tags: [GatePasses]
 *     summary: Get the current active gate pass for the student
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Active gate pass details }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 *       404: { description: No active gate pass }
 */
router.get('/active', requireRole(Role.STUDENT), gatePassController.getActivePass);

/**
 * @openapi
 * /gate-passes/generate:
 *   post:
 *     tags: [GatePasses]
 *     summary: Generate a QR code gate pass for the student's approved leave
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201: { description: Gate pass generated with QR token }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 *       404: { description: No approved leave found }
 */
router.post('/generate', requireRole(Role.STUDENT), gatePassController.generatePass);

/**
 * @openapi
 * /gate-passes/verify/{token}:
 *   get:
 *     tags: [GatePasses]
 *     summary: Verify a gate pass QR token and return student/leave details
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Verification result with student and leave details }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - GUARD only }
 */
router.get('/verify/:token', requireRole(Role.GUARD), gatePassController.verifyToken);

export default router;
