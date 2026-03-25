import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as emergencyAlertController from '@controllers/emergency-alert.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/active', emergencyAlertController.getActiveAlerts);

router.post('/', requireRole(Role.WARDEN_ADMIN), emergencyAlertController.createAlert);
router.get('/', requireRole(Role.WARDEN_ADMIN), emergencyAlertController.listAlerts);
router.post('/:id/resolve', requireRole(Role.WARDEN_ADMIN), emergencyAlertController.resolveAlert);

export default router;
