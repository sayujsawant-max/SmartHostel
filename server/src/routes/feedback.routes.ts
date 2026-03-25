import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as feedbackController from '@controllers/feedback.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole(Role.STUDENT), feedbackController.submitFeedback);
router.get('/', feedbackController.listFeedbacks);
router.get('/stats', requireRole(Role.WARDEN_ADMIN), feedbackController.getFeedbackStats);
router.delete('/:id', feedbackController.deleteFeedback);

export default router;
