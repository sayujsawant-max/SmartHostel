import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as roomMatchingController from '@controllers/room-matching.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /room-matching:
 *   get:
 *     tags: [Room Matching]
 *     summary: Get AI-powered room match suggestions
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: block
 *         schema: { type: string }
 *         description: Preferred block
 *       - in: query
 *         name: ac
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: quiet
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: budget
 *         schema: { type: number }
 *         description: Max fee per semester
 *     responses:
 *       200: { description: Room match suggestions }
 */
router.get('/', requireRole(Role.STUDENT), roomMatchingController.getMatches);

export default router;
