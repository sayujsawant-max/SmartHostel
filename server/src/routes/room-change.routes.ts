import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { RoomChange } from '../models/room-change.model.js';
import { Room } from '../models/room.model.js';
import { User } from '../models/user.model.js';

const router = Router();

router.use(authMiddleware);

// POST / — Student creates a room change request
router.post('/', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const { requestedRoomId, reason } = req.body as { requestedRoomId: string; reason: string };

  if (!requestedRoomId || !reason) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'requestedRoomId and reason are required', retryable: false },
    });
    return;
  }

  // Look up the student to find their current room
  const student = await User.findById(req.user!._id).lean();
  if (!student || !student.roomNumber || !student.block) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_CURRENT_ROOM', message: 'You do not have a room assigned', retryable: false },
    });
    return;
  }

  // Find current room document
  const currentRoom = await Room.findOne({ block: student.block, roomNumber: student.roomNumber }).lean();
  if (!currentRoom) {
    res.status(400).json({
      success: false,
      error: { code: 'ROOM_NOT_FOUND', message: 'Current room not found in the system', retryable: false },
    });
    return;
  }

  // Check if student already has a pending request
  const existing = await RoomChange.findOne({ studentId: req.user!._id, status: 'PENDING' }).lean();
  if (existing) {
    res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_REQUEST', message: 'You already have a pending room change request', retryable: false },
    });
    return;
  }

  // Validate requested room exists and has available beds
  const requestedRoom = await Room.findById(requestedRoomId).lean();
  if (!requestedRoom) {
    res.status(404).json({
      success: false,
      error: { code: 'ROOM_NOT_FOUND', message: 'Requested room not found', retryable: false },
    });
    return;
  }

  if (requestedRoom.occupiedBeds >= requestedRoom.totalBeds) {
    res.status(400).json({
      success: false,
      error: { code: 'ROOM_FULL', message: 'Requested room has no available beds', retryable: false },
    });
    return;
  }

  if (String(currentRoom._id) === requestedRoomId) {
    res.status(400).json({
      success: false,
      error: { code: 'SAME_ROOM', message: 'Cannot request change to the same room', retryable: false },
    });
    return;
  }

  // Validate gender match
  const genderMap: Record<string, string> = { MALE: 'BOYS', FEMALE: 'GIRLS' };
  if (genderMap[student.gender ?? ''] !== requestedRoom.hostelGender) {
    res.status(400).json({
      success: false,
      error: { code: 'GENDER_MISMATCH', message: 'Room gender does not match yours', retryable: false },
    });
    return;
  }

  // Validate academic year — occupants in the requested room must share the same year
  if (student.academicYear) {
    const occupants = await User.find({
      block: requestedRoom.block,
      roomNumber: requestedRoom.roomNumber,
      isActive: true,
      _id: { $ne: req.user!._id },
    }).lean();

    const mismatch = occupants.find((o) => o.academicYear && o.academicYear !== student.academicYear);
    if (mismatch) {
      res.status(400).json({
        success: false,
        error: {
          code: 'YEAR_MISMATCH',
          message: `This room has students from Year ${mismatch.academicYear}. You are Year ${student.academicYear}.`,
          retryable: false,
        },
      });
      return;
    }
  }

  const roomChangeRequest = await RoomChange.create({
    studentId: req.user!._id,
    currentRoomId: currentRoom._id,
    requestedRoomId,
    reason,
  });

  res.status(201).json({ success: true, data: roomChangeRequest });
});

// GET /my — Student gets their own room change requests
router.get('/my', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const requests = await RoomChange.find({ studentId: req.user!._id })
    .populate('currentRoomId', 'block floor roomNumber roomType acType feePerSemester totalBeds occupiedBeds')
    .populate('requestedRoomId', 'block floor roomNumber roomType acType feePerSemester totalBeds occupiedBeds')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: { requests } });
});

// GET / — Warden gets all room change requests
router.get('/', requireRole(Role.WARDEN_ADMIN), async (_req: Request, res: Response) => {
  const requests = await RoomChange.find()
    .populate('studentId', 'name email block floor roomNumber')
    .populate('currentRoomId', 'block floor roomNumber roomType acType feePerSemester totalBeds occupiedBeds')
    .populate('requestedRoomId', 'block floor roomNumber roomType acType feePerSemester totalBeds occupiedBeds')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: { requests } });
});

// PATCH /:id/approve — Warden approves and completes room change
router.patch('/:id/approve', requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const roomChangeRequest = await RoomChange.findById(req.params.id);
  if (!roomChangeRequest) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Room change request not found', retryable: false },
    });
    return;
  }

  if (roomChangeRequest.status !== 'PENDING') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Only pending requests can be approved', retryable: false },
    });
    return;
  }

  // Re-check that the requested room still has beds available
  const requestedRoom = await Room.findById(roomChangeRequest.requestedRoomId);
  if (!requestedRoom || requestedRoom.occupiedBeds >= requestedRoom.totalBeds) {
    res.status(400).json({
      success: false,
      error: { code: 'ROOM_FULL', message: 'Requested room no longer has available beds', retryable: false },
    });
    return;
  }

  const now = new Date();

  // 1. Decrement occupiedBeds on current room
  await Room.findByIdAndUpdate(roomChangeRequest.currentRoomId, { $inc: { occupiedBeds: -1 } });

  // 2. Increment occupiedBeds on requested room
  await Room.findByIdAndUpdate(roomChangeRequest.requestedRoomId, { $inc: { occupiedBeds: 1 } });

  // 3. Update User's roomNumber, block, floor to match new room
  await User.findByIdAndUpdate(roomChangeRequest.studentId, {
    roomNumber: requestedRoom.roomNumber,
    block: requestedRoom.block,
    floor: requestedRoom.floor,
  });

  // 4. Set status to COMPLETED
  roomChangeRequest.status = 'COMPLETED';
  roomChangeRequest.reviewedBy = new mongoose.Types.ObjectId(req.user!._id);
  roomChangeRequest.reviewedAt = now;
  roomChangeRequest.completedAt = now;
  await roomChangeRequest.save();

  res.json({ success: true, data: roomChangeRequest });
});

// PATCH /:id/reject — Warden rejects room change request
router.patch('/:id/reject', requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const { reason } = req.body as { reason: string };

  if (!reason) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required', retryable: false },
    });
    return;
  }

  const roomChangeRequest = await RoomChange.findById(req.params.id);
  if (!roomChangeRequest) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Room change request not found', retryable: false },
    });
    return;
  }

  if (roomChangeRequest.status !== 'PENDING') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Only pending requests can be rejected', retryable: false },
    });
    return;
  }

  roomChangeRequest.status = 'REJECTED';
  roomChangeRequest.rejectionReason = reason;
  roomChangeRequest.reviewedBy = new mongoose.Types.ObjectId(req.user!._id);
  roomChangeRequest.reviewedAt = new Date();
  await roomChangeRequest.save();

  res.json({ success: true, data: roomChangeRequest });
});

export default router;
