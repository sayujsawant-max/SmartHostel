import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { loginRateLimiter, registerRateLimiter, refreshRateLimiter } from '@middleware/auth-rate-limit.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  selfResetPasswordSchema,
  changePasswordSchema,
  googleAuthSchema,
} from '@smarthostel/shared';
import * as authController from '@controllers/auth.controller.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new student account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, maxLength: 128 }
 *     responses:
 *       201: { description: User registered successfully }
 *       409: { description: Email already exists }
 */
router.post('/register', registerRateLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Login successful, sets httpOnly cookies }
 *       401: { description: Invalid credentials }
 *       429: { description: Too many login attempts }
 */
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Not authenticated }
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh cookie
 *     responses:
 *       200: { description: Token refreshed }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh', refreshRateLimiter, authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and clear auth cookies
 *     responses:
 *       200: { description: Logged out successfully }
 */
router.post('/logout', authController.logout);

router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);
router.post('/forgot-password', loginRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(selfResetPasswordSchema), authController.resetPassword);
router.post('/google', loginRateLimiter, validate(googleAuthSchema), authController.googleAuth);

export default router;
