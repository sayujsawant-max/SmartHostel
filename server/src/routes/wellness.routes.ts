import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as wellnessController from '@controllers/wellness.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

router.post('/checks', wellnessController.createWellnessCheck);
router.get('/checks', wellnessController.listWellnessChecks);
router.get('/at-risk', wellnessController.getAtRiskStudents);
router.get('/stats', wellnessController.getWellnessStats);
router.get('/student/:studentId', wellnessController.getStudentHistory);

export default router;
