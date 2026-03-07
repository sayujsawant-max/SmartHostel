import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as leaveController from '@controllers/leave.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /leaves:
 *   post:
 *     tags: [Leaves]
 *     summary: Create a new leave request
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, startDate, endDate, reason]
 *             properties:
 *               type: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               reason: { type: string }
 *     responses:
 *       201: { description: Leave request created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 */
router.post('/', requireRole(Role.STUDENT), leaveController.createLeave);

/**
 * @openapi
 * /leaves:
 *   get:
 *     tags: [Leaves]
 *     summary: List leave requests
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by leave status
 *     responses:
 *       200: { description: List of leave requests }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT or WARDEN_ADMIN only }
 */
router.get('/', requireRole(Role.STUDENT, Role.WARDEN_ADMIN), leaveController.getLeaves);

/**
 * @openapi
 * /leaves/{id}/approve:
 *   patch:
 *     tags: [Leaves]
 *     summary: Approve a leave request
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Leave approved }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Leave not found }
 */
router.patch('/:id/approve', requireRole(Role.WARDEN_ADMIN), leaveController.approveLeave);

/**
 * @openapi
 * /leaves/{id}/reject:
 *   patch:
 *     tags: [Leaves]
 *     summary: Reject a leave request
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200: { description: Leave rejected }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Leave not found }
 */
router.patch('/:id/reject', requireRole(Role.WARDEN_ADMIN), leaveController.rejectLeave);

/**
 * @openapi
 * /leaves/{id}/cancel:
 *   patch:
 *     tags: [Leaves]
 *     summary: Cancel own leave request
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Leave cancelled }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 *       404: { description: Leave not found }
 */
router.patch('/:id/cancel', requireRole(Role.STUDENT), leaveController.cancelLeave);

/**
 * @openapi
 * /leaves/{id}/correct:
 *   patch:
 *     tags: [Leaves]
 *     summary: Mark a leave as needing correction
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200: { description: Leave marked for correction }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Leave not found }
 */
router.patch('/:id/correct', requireRole(Role.WARDEN_ADMIN), leaveController.correctLeave);

export default router;
