import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import * as consentController from '@controllers/consent.controller.js';

const router = Router();

router.post('/', authMiddleware, consentController.createConsent);

export default router;
