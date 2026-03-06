import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as gatePassController from '@controllers/gate-pass.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/active', requireRole(Role.STUDENT), gatePassController.getActivePass);

export default router;
