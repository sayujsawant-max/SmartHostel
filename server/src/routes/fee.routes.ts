import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as feeController from '@controllers/fee.controller.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(Role.WARDEN_ADMIN));

/**
 * @openapi
 * /fees:
 *   get:
 *     tags: [Fees]
 *     summary: List all fees (warden) — populates student name/room
 *     security: [{ cookieAuth: [] }]
 */
router.get('/students', feeController.listStudents);

router.get('/', feeController.list);

/**
 * @openapi
 * /fees:
 *   post:
 *     tags: [Fees]
 *     summary: Issue a fee to a single student
 *     security: [{ cookieAuth: [] }]
 */
router.post('/', feeController.issue);

/**
 * @openapi
 * /fees/all:
 *   post:
 *     tags: [Fees]
 *     summary: Issue the same fee to every student
 *     security: [{ cookieAuth: [] }]
 */
router.post('/all', feeController.issueAll);

/**
 * @openapi
 * /fees/{id}:
 *   delete:
 *     tags: [Fees]
 *     summary: Delete an unpaid fee
 *     security: [{ cookieAuth: [] }]
 */
router.delete('/:id', feeController.remove);

export default router;
