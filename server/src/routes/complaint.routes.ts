import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as complaintController from '@controllers/complaint.controller.js';

const router = Router();

router.use(authMiddleware);

// Student: create complaint (with optional photo)
router.post('/', requireRole(Role.STUDENT), complaintController.createComplaint);

// Student or Warden: list complaints
router.get('/', requireRole(Role.STUDENT, Role.WARDEN_ADMIN), complaintController.getComplaints);

// Any authenticated user with access: get complaint by ID
router.get('/:id', requireRole(Role.STUDENT, Role.WARDEN_ADMIN, Role.MAINTENANCE), complaintController.getComplaintById);

// Timeline for a complaint
router.get('/:id/timeline', requireRole(Role.STUDENT, Role.WARDEN_ADMIN, Role.MAINTENANCE), complaintController.getComplaintTimeline);

export default router;
