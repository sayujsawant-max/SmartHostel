import { Router } from 'express';
import multer from 'multer';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as fileUploadController from '@controllers/file-upload.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

router.use(authMiddleware);

router.post('/upload', upload.single('file'), fileUploadController.uploadFile);
router.delete('/:publicId', requireRole(Role.WARDEN_ADMIN), fileUploadController.deleteFile);

export default router;
