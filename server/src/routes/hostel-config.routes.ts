import { Router } from 'express';
import { Role, updateHostelConfigSchema } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import * as hostelConfigController from '@controllers/hostel-config.controller.js';

const router = Router();

/**
 * @openapi
 * /hostel-config:
 *   get:
 *     tags: [HostelConfig]
 *     summary: Get the current hostel configuration (public — used for branding, room catalog, feature flags)
 *     responses:
 *       200: { description: Hostel config }
 */
router.get('/', hostelConfigController.getHostelConfig);

/**
 * @openapi
 * /hostel-config:
 *   patch:
 *     tags: [HostelConfig]
 *     summary: Update hostel configuration (warden only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Updated hostel config }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.patch(
  '/',
  authMiddleware,
  requireRole(Role.WARDEN_ADMIN),
  validate(updateHostelConfigSchema),
  hostelConfigController.updateHostelConfig,
);

export default router;
