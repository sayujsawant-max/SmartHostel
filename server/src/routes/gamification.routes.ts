import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as gamificationController from '@controllers/gamification.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /gamification/streak:
 *   get:
 *     tags: [Gamification]
 *     summary: Get student streak and badges
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Streak data with badges }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 */
router.get('/streak', requireRole(Role.STUDENT), gamificationController.getStreak);

export default router;
