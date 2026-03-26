import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as inventoryController from '@controllers/inventory.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole(Role.MAINTENANCE, Role.WARDEN_ADMIN), inventoryController.listInventory);
router.post('/', requireRole(Role.MAINTENANCE), inventoryController.addInventoryItem);

export default router;
