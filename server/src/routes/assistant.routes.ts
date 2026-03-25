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

/**
 * @openapi
 * /assistant/chat:
 *   post:
 *     tags: [Assistant]
 *     summary: AI-powered chat assistant
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, maxLength: 500 }
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [user, assistant] }
 *                     content: { type: string }
 *     responses:
 *       200: { description: AI response }
 *       401: { description: Unauthorized }
 *       502: { description: AI service error }
 */
router.post('/chat', assistantController.chat);

/**
 * @openapi
 * /assistant/chat/stream:
 *   post:
 *     tags: [Assistant]
 *     summary: AI chat with streaming SSE response
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: SSE stream of AI response chunks }
 */
router.post('/chat/stream', assistantController.chatStream);

export default router;
