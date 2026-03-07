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

export default router;
