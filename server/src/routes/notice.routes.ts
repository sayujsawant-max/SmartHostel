import { Router } from 'express';
import { Role, createNoticeSchema } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import * as noticeController from '@controllers/notice.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /notices:
 *   post:
 *     tags: [Notices]
 *     summary: Create a new notice
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, target]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               target: { type: string }
 *               targetBlock: { type: string }
 *               targetFloor: { type: number }
 *     responses:
 *       201: { description: Notice created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.post('/', requireRole(Role.WARDEN_ADMIN), validate(createNoticeSchema), noticeController.createNotice);

/**
 * @openapi
 * /notices:
 *   get:
 *     tags: [Notices]
 *     summary: List all notices (warden view)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of notices }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/', requireRole(Role.WARDEN_ADMIN), noticeController.getNotices);

/**
 * @openapi
 * /notices/{id}/deactivate:
 *   patch:
 *     tags: [Notices]
 *     summary: Deactivate a notice
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notice deactivated }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Notice not found }
 */
router.patch('/:id/deactivate', requireRole(Role.WARDEN_ADMIN), noticeController.deactivateNotice);

/**
 * @openapi
 * /notices/my-notices:
 *   get:
 *     tags: [Notices]
 *     summary: Get notices relevant to the current student
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of student-relevant notices }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 */
router.get('/my-notices', requireRole(Role.STUDENT), noticeController.getStudentNotices);

export default router;
