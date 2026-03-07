import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as roomController from '@controllers/room.controller.js';

const router = Router();

// Public routes - anyone can browse rooms and see availability
router.get('/', roomController.listRooms);
router.get('/availability', roomController.getAvailability);
router.get('/:id', roomController.getRoom);

// Admin-only routes
router.post('/', authMiddleware, requireRole(Role.WARDEN_ADMIN), roomController.createRoom);
router.patch('/:id', authMiddleware, requireRole(Role.WARDEN_ADMIN), roomController.updateRoom);

export default router;
