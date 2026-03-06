import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import * as notificationController from '@controllers/notification.controller.js';

const router = Router();

router.use(authMiddleware);

// Get notifications + unread count
router.get('/', notificationController.getNotifications);

// Mark all as read (must come before /:id to avoid matching "read-all" as an ID)
router.patch('/read-all', notificationController.markAllAsRead);

// Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

export default router;
