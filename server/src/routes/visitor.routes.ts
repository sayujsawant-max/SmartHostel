import { Router, type Request, type Response } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { Visitor } from '@models/visitor.model.js';

const router = Router();

router.use(authMiddleware);

// POST / — Student registers a visitor
router.post('/', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const { visitorName, visitorPhone, relationship, purpose, expectedDate, expectedTime } = req.body as {
    visitorName: string;
    visitorPhone: string;
    relationship?: string;
    purpose: string;
    expectedDate: string;
    expectedTime?: string;
  };

  if (!visitorName || !visitorPhone || !purpose || !expectedDate) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'visitorName, visitorPhone, purpose, and expectedDate are required' },
    });
    return;
  }

  const visitor = await Visitor.create({
    studentId: req.user!._id,
    visitorName,
    visitorPhone,
    relationship: relationship || 'Other',
    purpose,
    expectedDate: new Date(expectedDate),
    expectedTime: expectedTime || '',
  });

  res.status(201).json({ success: true, data: visitor });
});

// GET /my — Student gets their own visitor registrations
router.get('/my', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const visitors = await Visitor.find({ studentId: req.user!._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: visitors });
});

// GET / — Warden/Guard gets all visitor registrations with optional filters
router.get('/', requireRole(Role.WARDEN_ADMIN, Role.GUARD), async (req: Request, res: Response) => {
  const { status, date } = req.query as { status?: string; date?: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (status) {
    filter.status = status;
  }

  if (date) {
    const day = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.expectedDate = { $gte: day, $lt: nextDay };
  }

  const visitors = await Visitor.find(filter)
    .populate('studentId', 'name email roomNumber block')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: visitors });
});

// PATCH /:id/approve — Warden approves a visitor request
router.patch('/:id/approve', requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const visitor = await Visitor.findOneAndUpdate(
    { _id: req.params.id, status: 'PENDING' },
    { status: 'APPROVED', approvedBy: req.user!._id, approvedAt: new Date() },
    { new: true },
  );

  if (!visitor) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Visitor request not found or not pending' },
    });
    return;
  }

  res.json({ success: true, data: visitor });
});

// PATCH /:id/reject — Warden rejects a visitor request with reason
router.patch('/:id/reject', requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string };

  const visitor = await Visitor.findOneAndUpdate(
    { _id: req.params.id, status: 'PENDING' },
    { status: 'REJECTED', rejectionReason: reason || '', approvedBy: req.user!._id },
    { new: true },
  );

  if (!visitor) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Visitor request not found or not pending' },
    });
    return;
  }

  res.json({ success: true, data: visitor });
});

// PATCH /:id/check-in — Guard marks visitor as checked in
router.patch('/:id/check-in', requireRole(Role.GUARD), async (req: Request, res: Response) => {
  const visitor = await Visitor.findOneAndUpdate(
    { _id: req.params.id, status: 'APPROVED' },
    { status: 'CHECKED_IN', checkedInAt: new Date() },
    { new: true },
  );

  if (!visitor) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Visitor request not found or not approved' },
    });
    return;
  }

  res.json({ success: true, data: visitor });
});

// PATCH /:id/check-out — Guard marks visitor as checked out
router.patch('/:id/check-out', requireRole(Role.GUARD), async (req: Request, res: Response) => {
  const visitor = await Visitor.findOneAndUpdate(
    { _id: req.params.id, status: 'CHECKED_IN' },
    { status: 'CHECKED_OUT', checkedOutAt: new Date() },
    { new: true },
  );

  if (!visitor) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Visitor not found or not checked in' },
    });
    return;
  }

  res.json({ success: true, data: visitor });
});

export default router;
