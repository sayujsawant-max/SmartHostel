import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as roomController from '@controllers/room.controller.js';

const router = Router();

/**
 * @openapi
 * /rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: List rooms with optional filters
 *     parameters:
 *       - in: query
 *         name: hostelGender
 *         schema: { type: string }
 *       - in: query
 *         name: roomType
 *         schema: { type: string }
 *       - in: query
 *         name: acType
 *         schema: { type: string }
 *       - in: query
 *         name: block
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of rooms }
 */
router.get('/', roomController.listRooms);

/**
 * @openapi
 * /rooms/availability:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room availability summary
 *     responses:
 *       200: { description: Room availability data }
 */
router.get('/availability', roomController.getAvailability);

/**
 * @openapi
 * /rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get a room by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Room details }
 *       404: { description: Room not found }
 */
router.get('/:id', roomController.getRoom);

/**
 * @openapi
 * /rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a new room
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Room created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 */
router.post('/', authMiddleware, requireRole(Role.WARDEN_ADMIN), roomController.createRoom);

/**
 * @openapi
 * /rooms/{id}:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update a room
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Room updated }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - WARDEN_ADMIN only }
 *       404: { description: Room not found }
 */
router.patch('/:id', authMiddleware, requireRole(Role.WARDEN_ADMIN), roomController.updateRoom);

export default router;
