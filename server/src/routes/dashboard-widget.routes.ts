import { Router } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import * as dashboardWidgetController from '@controllers/dashboard-widget.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', dashboardWidgetController.getLayout);
router.put('/', dashboardWidgetController.saveLayout);
router.post('/reset', dashboardWidgetController.resetLayout);

export default router;
