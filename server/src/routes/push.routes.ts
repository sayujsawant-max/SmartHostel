import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as pushController from '@controllers/push.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/subscribe', pushController.subscribe);
router.post('/unsubscribe', pushController.unsubscribe);
router.post('/send', requireRole(Role.WARDEN_ADMIN), pushController.sendPush);

export default router;
