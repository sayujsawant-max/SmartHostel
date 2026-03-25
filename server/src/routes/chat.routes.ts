import { Router } from 'express';
import { sendMessageSchema } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import * as chatController from '@controllers/chat.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/messages', validate(sendMessageSchema), chatController.sendMessage);
router.get('/conversations', chatController.listConversations);
router.get('/messages/:partnerId', chatController.getMessages);
router.patch('/messages/:partnerId/read', chatController.markAsRead);
router.get('/unread-count', chatController.getUnreadCount);

export default router;
