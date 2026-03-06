import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as gateController from '@controllers/gate.controller.js';
import { passCodeRateLimiter } from '@middleware/passcode-rate-limit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/validate', requireRole(Role.GUARD), passCodeRateLimiter, gateController.validate);
router.post('/reconcile', requireRole(Role.GUARD), gateController.reconcile);

export default router;
