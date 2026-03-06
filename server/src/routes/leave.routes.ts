import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as leaveController from '@controllers/leave.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole(Role.STUDENT), leaveController.createLeave);
router.get('/', requireRole(Role.STUDENT, Role.WARDEN_ADMIN), leaveController.getLeaves);

export default router;
