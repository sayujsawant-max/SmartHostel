import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { loginRateLimiter, registerRateLimiter, refreshRateLimiter } from '@middleware/auth-rate-limit.middleware.js';
import * as authController from '@controllers/auth.controller.js';

const router = Router();

router.post('/register', registerRateLimiter, authController.register);
router.post('/login', loginRateLimiter, authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', refreshRateLimiter, authController.refresh);
router.post('/logout', authController.logout);

export default router;
