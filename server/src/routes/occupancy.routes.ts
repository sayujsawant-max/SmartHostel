import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as occupancyController from '@controllers/occupancy.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

router.get('/overview', occupancyController.getOverview);
router.get('/blocks', occupancyController.getBlockOccupancy);
router.get('/blocks/:block/floors', occupancyController.getFloorOccupancy);
router.get('/rooms', occupancyController.getRoomGrid);
router.get('/timeline', occupancyController.getTimeline);

export default router;
