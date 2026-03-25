import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as complaintAnalyticsController from '@controllers/complaint-analytics.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

router.get('/categories', complaintAnalyticsController.getCategoryBreakdown);
router.get('/trends', complaintAnalyticsController.getTrends);
router.get('/resolution', complaintAnalyticsController.getResolutionStats);
router.get('/hotspots', complaintAnalyticsController.getHotspots);
router.get('/predictions', complaintAnalyticsController.getPredictions);

export default router;
