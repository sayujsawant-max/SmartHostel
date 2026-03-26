import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as inspectionController from '@controllers/inspection.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

router.get('/', inspectionController.listInspections);
router.post('/', inspectionController.createInspection);

export default router;
