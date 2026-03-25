import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as assetController from '@controllers/asset.controller.js';

const router = Router();

router.use(authMiddleware, requireRole(Role.MAINTENANCE, Role.WARDEN_ADMIN));

router.post('/', assetController.createAsset);
router.get('/', assetController.listAssets);
router.get('/stats', assetController.getAssetStats);
router.get('/:assetTag', assetController.getAssetByTag);
router.put('/:id', assetController.updateAsset);
router.post('/:id/maintenance', requireRole(Role.MAINTENANCE), assetController.logMaintenance);

export default router;
