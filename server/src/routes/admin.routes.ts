import { Router } from 'express';
import { Role, createUserSchema, resetPasswordSchema } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import * as adminController from '@controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of users }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/', adminController.listUsers);

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new user
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string }
 *               block: { type: string }
 *               floor: { type: number }
 *               roomNumber: { type: string }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.post('/', validate(createUserSchema), adminController.createUser);

/**
 * @openapi
 * /admin/users/{id}/disable:
 *   patch:
 *     tags: [Admin]
 *     summary: Disable a user account
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User disabled }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: User not found }
 */
router.patch('/:id/disable', adminController.disableUser);
router.patch('/:id/enable', adminController.enableUser);

/**
 * @openapi
 * /admin/users/{id}/reset-password:
 *   post:
 *     tags: [Admin]
 *     summary: Reset a user's password
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200: { description: Password reset successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: User not found }
 */
router.post('/:id/reset-password', validate(resetPasswordSchema), adminController.resetPassword);

export default router;
