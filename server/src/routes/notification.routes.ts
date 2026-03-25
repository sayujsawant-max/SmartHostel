import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import * as notificationController from '@controllers/notification.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications and unread count
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of notifications with unread count }
 *       401: { description: Unauthorized }
 */
router.get('/', notificationController.getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: All notifications marked as read }
 *       401: { description: Unauthorized }
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked as read }
 *       401: { description: Unauthorized }
 *       404: { description: Notification not found }
 */
router.patch('/:id/read', notificationController.markAsRead);

/** Notification preferences */
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreferences);

export default router;
