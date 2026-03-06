import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as adminController from '@controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

router.post('/', adminController.createUser);
router.patch('/:id/disable', adminController.disableUser);
router.post('/:id/reset-password', adminController.resetPassword);

export default router;
