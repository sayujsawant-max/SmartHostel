import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as noticeController from '@controllers/notice.controller.js';

const router = Router();
router.use(authMiddleware);

// Warden endpoints
router.post('/', requireRole(Role.WARDEN_ADMIN), noticeController.createNotice);
router.get('/', requireRole(Role.WARDEN_ADMIN), noticeController.getNotices);
router.patch('/:id/deactivate', requireRole(Role.WARDEN_ADMIN), noticeController.deactivateNotice);

// Student endpoint
router.get('/my-notices', requireRole(Role.STUDENT), noticeController.getStudentNotices);

export default router;
