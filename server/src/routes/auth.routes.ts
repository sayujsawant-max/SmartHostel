import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import * as authController from '@controllers/auth.controller.js';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
