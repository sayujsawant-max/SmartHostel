import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as resourceController from '@controllers/resource.controller.js';

const router = Router();

/**
 * @openapi
 * /resources:
 *   get:
 *     tags: [Resources]
 *     summary: List active bookable resources (public).
 *     responses:
 *       200: { description: List of active resources }
 */
router.get('/', resourceController.listResources);

/**
 * @openapi
 * /resources/{key}:
 *   get:
 *     tags: [Resources]
 *     summary: Get a single resource definition.
 */
router.get('/:key', resourceController.getResource);

/**
 * @openapi
 * /resources/{key}/slots:
 *   get:
 *     tags: [Resources]
 *     summary: Available slots on a given date with seat counts.
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 */
router.get('/:key/slots', resourceController.getSlots);

/**
 * @openapi
 * /resources/{key}/book:
 *   post:
 *     tags: [Resources]
 *     summary: Book a slot. Requires authentication.
 *     security: [{ cookieAuth: [] }]
 */
router.post('/:key/book', authMiddleware, resourceController.bookSlot);

export default router;

/* ── Booking sub-router exported separately so it can mount at /api/resource-bookings ─ */

export const bookingRouter = Router();

bookingRouter.use(authMiddleware);

bookingRouter.get('/me', resourceController.listMyBookings);
bookingRouter.delete('/:id', resourceController.cancelBooking);

/* ── Warden admin sub-router ─────────────────────────────────── */

export const adminResourceRouter = Router();

adminResourceRouter.use(authMiddleware, requireRole(Role.WARDEN_ADMIN));

adminResourceRouter.get('/', resourceController.adminListResources);
adminResourceRouter.post('/', resourceController.adminCreateResource);
adminResourceRouter.patch('/:key', resourceController.adminUpdateResource);
adminResourceRouter.delete('/:key', resourceController.adminDeleteResource);
