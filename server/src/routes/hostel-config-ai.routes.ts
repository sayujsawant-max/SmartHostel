import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as hostelConfigAiController from '@controllers/hostel-config-ai.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

/**
 * @openapi
 * /admin/hostel-config-ai/chat:
 *   post:
 *     tags: [HostelConfig]
 *     summary: Natural-language admin chat — interpret a warden's request, call the
 *               appropriate hostel-config mutation, and return the result + updated config.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string }
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [user, assistant] }
 *                     content: { type: string }
 *     responses:
 *       200: { description: AI reply with applied actions and latest config }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.post('/chat', hostelConfigAiController.chat);

export default router;
