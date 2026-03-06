import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as gateController from '@controllers/gate.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/validate', requireRole(Role.GUARD), gateController.validate);

export default router;
