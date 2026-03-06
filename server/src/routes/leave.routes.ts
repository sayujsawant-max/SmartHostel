import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as leaveController from '@controllers/leave.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole(Role.STUDENT), leaveController.createLeave);
router.get('/', requireRole(Role.STUDENT, Role.WARDEN_ADMIN), leaveController.getLeaves);
router.patch('/:id/approve', requireRole(Role.WARDEN_ADMIN), leaveController.approveLeave);
router.patch('/:id/reject', requireRole(Role.WARDEN_ADMIN), leaveController.rejectLeave);
router.patch('/:id/cancel', requireRole(Role.STUDENT), leaveController.cancelLeave);

export default router;
