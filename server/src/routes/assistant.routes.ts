import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as assistantController from '@controllers/assistant.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /assistant/faq:
 *   get:
 *     tags: [Assistant]
 *     summary: Get FAQ entries
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of FAQ entries }
 *       401: { description: Unauthorized }
 */
router.get('/faq', assistantController.getFaqEntries);

/**
 * @openapi
 * /assistant/fees:
 *   get:
 *     tags: [Assistant]
 *     summary: Get fee status for the current student
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Student fee details }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 */
router.get('/fees', requireRole(Role.STUDENT), assistantController.getStudentFees);

export default router;
