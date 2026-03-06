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

// Warden: get maintenance staff for assignment dropdown
router.get('/maintenance-staff', requireRole(Role.WARDEN_ADMIN), complaintController.getMaintenanceStaff);

// Maintenance: get assigned tasks
router.get('/my-tasks', requireRole(Role.MAINTENANCE), complaintController.getAssignedTasks);

// Maintenance: get resolved history
router.get('/my-history', requireRole(Role.MAINTENANCE), complaintController.getResolvedTasks);

// Any authenticated user with access: get complaint by ID
router.get('/:id', requireRole(Role.STUDENT, Role.WARDEN_ADMIN, Role.MAINTENANCE), complaintController.getComplaintById);

// Timeline for a complaint
router.get('/:id/timeline', requireRole(Role.STUDENT, Role.WARDEN_ADMIN, Role.MAINTENANCE), complaintController.getComplaintTimeline);

// Warden: assign complaint to maintenance staff
router.patch('/:id/assign', requireRole(Role.WARDEN_ADMIN), complaintController.assignComplaint);

// Warden: override priority
router.patch('/:id/priority', requireRole(Role.WARDEN_ADMIN), complaintController.updatePriority);

// Maintenance/Warden: update complaint status
router.patch('/:id/status', requireRole(Role.MAINTENANCE, Role.WARDEN_ADMIN), complaintController.updateStatus);

export default router;
