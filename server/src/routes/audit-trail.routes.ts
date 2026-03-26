import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as auditTrailController from '@controllers/audit-trail.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

router.get('/', auditTrailController.listAuditEvents);

export default router;
