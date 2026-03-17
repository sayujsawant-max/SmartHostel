import { Router } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import * as roomController from '@controllers/room.controller.js';
import { Room } from '@models/room.model.js';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';

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
/**
 * @openapi
 * /rooms/request:
 *   post:
 *     tags: [Rooms]
 *     summary: Request a room assignment (student)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: string
 *             required: [roomId]
 *     responses:
 *       200: { description: Room assigned successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Room not found }
 */
router.post('/request', authMiddleware, requireRole(Role.STUDENT), async (req, res, next) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      throw new AppError('VALIDATION_ERROR', 'roomId is required', 400);
    }

    const student = await User.findById(req.user!._id);
    if (!student) {
      throw new AppError('NOT_FOUND', 'Student not found', 404);
    }
    if (student.roomNumber) {
      throw new AppError('VALIDATION_ERROR', 'You already have a room assigned', 400);
    }

    // Validate gender match: MALE -> BOYS, FEMALE -> GIRLS
    const genderMap: Record<string, string> = { MALE: 'BOYS', FEMALE: 'GIRLS' };
    const requiredGender = genderMap[student.gender ?? ''];

    // Validate academic year — existing occupants must share the same year
    if (student.academicYear) {
      const targetRoom = await Room.findById(roomId).lean();
      if (targetRoom) {
        const occupants = await User.find({
          block: targetRoom.block,
          roomNumber: targetRoom.roomNumber,
          isActive: true,
        }).lean();
        const mismatch = occupants.find((o) => o.academicYear && o.academicYear !== student.academicYear);
        if (mismatch) {
          throw new AppError('VALIDATION_ERROR', `This room has Year ${mismatch.academicYear} students. You are Year ${student.academicYear}.`, 400);
        }
      }
    }

    // Atomically increment occupiedBeds only if a bed is available and gender matches
    const room = await Room.findOneAndUpdate(
      {
        _id: roomId,
        hostelGender: requiredGender,
        isActive: true,
        $expr: { $lt: ['$occupiedBeds', '$totalBeds'] },
      },
      { $inc: { occupiedBeds: 1 } },
      { new: true },
    );

    if (!room) {
      // Determine the specific error
      const existingRoom = await Room.findById(roomId);
      if (!existingRoom) throw new AppError('NOT_FOUND', 'Room not found', 404);
      if (existingRoom.hostelGender !== requiredGender) throw new AppError('VALIDATION_ERROR', 'Room gender does not match your gender', 400);
      throw new AppError('VALIDATION_ERROR', 'No available beds in this room', 400);
    }

    student.block = room.block;
    student.floor = room.floor;
    student.roomNumber = room.roomNumber;
    await student.save();

    res.json({ success: true, data: { user: student.toJSON() } });
  } catch (err) {
    next(err);
  }
});

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
