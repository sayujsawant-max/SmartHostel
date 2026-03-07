import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as complaintController from '@controllers/complaint.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /complaints:
 *   post:
 *     tags: [Complaints]
 *     summary: Create a new complaint with optional photo upload
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Complaint created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT only }
 */
router.post('/', requireRole(Role.STUDENT), complaintController.createComplaint);

/**
 * @openapi
 * /complaints:
 *   get:
 *     tags: [Complaints]
 *     summary: List complaints
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by complaint status
 *     responses:
 *       200: { description: List of complaints }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - STUDENT or WARDEN_ADMIN only }
 */
router.get('/', requireRole(Role.STUDENT, Role.WARDEN_ADMIN), complaintController.getComplaints);

/**
 * @openapi
 * /complaints/maintenance-staff:
 *   get:
 *     tags: [Complaints]
 *     summary: Get maintenance staff list for assignment dropdown
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of maintenance staff }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.get('/maintenance-staff', requireRole(Role.WARDEN_ADMIN), complaintController.getMaintenanceStaff);

/**
 * @openapi
 * /complaints/my-tasks:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaints assigned to current maintenance user
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of assigned tasks }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - MAINTENANCE only }
 */
router.get('/my-tasks', requireRole(Role.MAINTENANCE), complaintController.getAssignedTasks);

/**
 * @openapi
 * /complaints/my-history:
 *   get:
 *     tags: [Complaints]
 *     summary: Get resolved complaint history for current maintenance user
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of resolved tasks }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - MAINTENANCE only }
 */
router.get('/my-history', requireRole(Role.MAINTENANCE), complaintController.getResolvedTasks);

/**
 * @openapi
 * /complaints/{id}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get a complaint by ID
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Complaint details }
 *       401: { description: Unauthorized }
 *       404: { description: Complaint not found }
 */
router.get('/:id', requireRole(Role.STUDENT, Role.WARDEN_ADMIN, Role.MAINTENANCE), complaintController.getComplaintById);

/**
 * @openapi
 * /complaints/{id}/timeline:
 *   get:
 *     tags: [Complaints]
 *     summary: Get the status timeline for a complaint
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Complaint timeline }
 *       401: { description: Unauthorized }
 *       404: { description: Complaint not found }
 */
router.get('/:id/timeline', requireRole(Role.STUDENT, Role.WARDEN_ADMIN, Role.MAINTENANCE), complaintController.getComplaintTimeline);

/**
 * @openapi
 * /complaints/{id}/assign:
 *   patch:
 *     tags: [Complaints]
 *     summary: Assign a complaint to maintenance staff
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assigneeId]
 *             properties:
 *               assigneeId: { type: string }
 *     responses:
 *       200: { description: Complaint assigned }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Complaint not found }
 */
router.patch('/:id/assign', requireRole(Role.WARDEN_ADMIN), complaintController.assignComplaint);

/**
 * @openapi
 * /complaints/{id}/priority:
 *   patch:
 *     tags: [Complaints]
 *     summary: Update complaint priority
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [priority]
 *             properties:
 *               priority: { type: string }
 *     responses:
 *       200: { description: Priority updated }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Complaint not found }
 */
router.patch('/:id/priority', requireRole(Role.WARDEN_ADMIN), complaintController.updatePriority);

/**
 * @openapi
 * /complaints/{id}/status:
 *   patch:
 *     tags: [Complaints]
 *     summary: Update complaint status
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *               resolutionNotes: { type: string }
 *     responses:
 *       200: { description: Status updated }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - MAINTENANCE or WARDEN_ADMIN only }
 *       404: { description: Complaint not found }
 */
router.patch('/:id/status', requireRole(Role.MAINTENANCE, Role.WARDEN_ADMIN), complaintController.updateStatus);

export default router;
