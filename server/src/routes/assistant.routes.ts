import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as assistantController from '@controllers/assistant.controller.js';

const router = Router();
router.use(authMiddleware);

// FAQ - accessible to all authenticated users
router.get('/faq', assistantController.getFaqEntries);

// Fee status - student only
router.get('/fees', requireRole(Role.STUDENT), assistantController.getStudentFees);

export default router;
