import { Router, type Request, type Response } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { LaundrySlot } from '@models/laundry-slot.model.js';

const router = Router();

router.use(authMiddleware);

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const start = (i + 6).toString().padStart(2, '0');
  const end = (i + 7).toString().padStart(2, '0');
  return `${start}:00-${end}:00`;
});

const MACHINES = [1, 2, 3, 4, 5];

async function ensureSlotsForDate(date: Date): Promise<void> {
  const existing = await LaundrySlot.countDocuments({ date });
  if (existing > 0) return;

  const docs = MACHINES.flatMap((machineNumber) =>
    TIME_SLOTS.map((timeSlot) => ({
      machineNumber,
      date,
      timeSlot,
      bookedBy: null,
      status: 'AVAILABLE' as const,
    })),
  );

  await LaundrySlot.insertMany(docs, { ordered: false }).catch(() => {
    // Ignore duplicate key errors from race conditions
  });
}

function startOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// GET / — Get slots for a given date (auto-generates if needed)
router.get('/', requireRole(Role.STUDENT, Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const dateParam = req.query.date as string | undefined;
  if (!dateParam) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'date query parameter is required' } });
    return;
  }

  const date = startOfDay(dateParam);
  if (isNaN(date.getTime())) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid date format' } });
    return;
  }

  await ensureSlotsForDate(date);

  const slots = await LaundrySlot.find({ date })
    .populate('bookedBy', 'name email')
    .sort({ machineNumber: 1, timeSlot: 1 })
    .lean();

  res.json({ success: true, data: slots });
});

// POST /book — Student books a slot
router.post('/book', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const { machineNumber, date, timeSlot } = req.body as { machineNumber: number; date: string; timeSlot: string };

  if (!machineNumber || !date || !timeSlot) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'machineNumber, date, and timeSlot are required' } });
    return;
  }

  const userId = req.user!._id;

  // Check max 2 active bookings per student
  const activeCount = await LaundrySlot.countDocuments({
    bookedBy: userId,
    status: { $in: ['BOOKED', 'IN_USE'] },
  });

  if (activeCount >= 2) {
    res.status(400).json({ success: false, error: { code: 'LIMIT_REACHED', message: 'You can have at most 2 active bookings' } });
    return;
  }

  const slotDate = startOfDay(date);

  const slot = await LaundrySlot.findOneAndUpdate(
    { machineNumber, date: slotDate, timeSlot, status: 'AVAILABLE' },
    { bookedBy: userId, status: 'BOOKED' },
    { new: true },
  );

  if (!slot) {
    res.status(409).json({ success: false, error: { code: 'SLOT_UNAVAILABLE', message: 'Slot is not available' } });
    return;
  }

  res.json({ success: true, data: slot });
});

// GET /my-bookings — Returns current student's upcoming bookings
router.get('/my-bookings', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const bookings = await LaundrySlot.find({
    bookedBy: req.user!._id,
    status: { $in: ['BOOKED', 'IN_USE'] },
  })
    .sort({ date: 1, timeSlot: 1 })
    .lean();

  res.json({ success: true, data: bookings });
});

// DELETE /:id — Student cancels their own booking
router.delete('/:id', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const slot = await LaundrySlot.findById(req.params.id);

  if (!slot) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Slot not found' } });
    return;
  }

  if (String(slot.bookedBy) !== String(req.user!._id)) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only cancel your own bookings' } });
    return;
  }

  if (slot.status !== 'BOOKED') {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Only BOOKED slots can be cancelled' } });
    return;
  }

  slot.bookedBy = null;
  slot.status = 'AVAILABLE';
  await slot.save();

  res.json({ success: true, data: slot });
});

export default router;
