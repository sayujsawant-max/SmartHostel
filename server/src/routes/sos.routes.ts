import { Router, type Request, type Response } from 'express';
import { Role, createSosSchema } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import { Sos } from '@models/sos.model.js';

const router = Router();

router.use(authMiddleware);

// POST / — Student creates SOS alert
router.post('/', requireRole(Role.STUDENT), validate(createSosSchema), async (req: Request, res: Response) => {
  const alert = await Sos.create({
    studentId: req.user!._id,
    message: req.body.message || 'Emergency SOS activated',
  });
  res.status(201).json({ success: true, data: alert });
});

// GET / — Warden gets all SOS alerts
router.get('/', requireRole(Role.WARDEN_ADMIN), async (_req: Request, res: Response) => {
  const alerts = await Sos.find()
    .populate('studentId', 'name email block floor roomNumber')
    .populate('acknowledgedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: alerts });
});

// GET /active — Warden gets active SOS count
router.get('/active', requireRole(Role.WARDEN_ADMIN), async (_req: Request, res: Response) => {
  const count = await Sos.countDocuments({ status: 'ACTIVE' });
  res.json({ success: true, data: { count } });
});

// PATCH /:id/acknowledge — Warden acknowledges SOS
router.patch('/:id/acknowledge', requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const alert = await Sos.findByIdAndUpdate(
    req.params.id,
    { status: 'ACKNOWLEDGED', acknowledgedBy: req.user!._id, acknowledgedAt: new Date() },
    { new: true },
  );
  if (!alert) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'SOS alert not found' } });
    return;
  }
  res.json({ success: true, data: alert });
});

// PATCH /:id/resolve — Warden resolves SOS
router.patch('/:id/resolve', requireRole(Role.WARDEN_ADMIN), async (req: Request, res: Response) => {
  const alert = await Sos.findByIdAndUpdate(
    req.params.id,
    { status: 'RESOLVED', resolvedAt: new Date() },
    { new: true },
  );
  if (!alert) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'SOS alert not found' } });
    return;
  }
  res.json({ success: true, data: alert });
});

export default router;
