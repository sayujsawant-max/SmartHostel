/**
 * Test-only routes for RBAC integration testing.
 * Registered in app.ts only when NODE_ENV === 'test'.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { buildVisibilityFilter } from '@middleware/data-visibility.middleware.js';

const router = Router();

// Admin-only endpoint (AC-1: students get 403)
router.get(
  '/admin-only',
  authMiddleware,
  requireRole('WARDEN_ADMIN'),
  (_req: Request, res: Response) => {
    res.json({ success: true, data: { message: 'Admin dashboard' } });
  },
);

// Student data endpoint with visibility filtering (AC-3: students see only own data)
router.get(
  '/student-data',
  authMiddleware,
  requireRole('STUDENT', 'WARDEN_ADMIN'),
  (req: Request, res: Response) => {
    const filter = buildVisibilityFilter(req.user!, 'ownedByStudent');
    res.json({ success: true, data: { filter } });
  },
);

// Complaint endpoint -- guards blocked (AC-2), students filtered (AC-3), maintenance filtered (AC-5)
router.get(
  '/complaints',
  authMiddleware,
  requireRole('STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE'),
  (req: Request, res: Response) => {
    const filter = buildVisibilityFilter(req.user!, 'assignedToMaintenance');
    res.json({ success: true, data: { filter } });
  },
);

// Maintenance tasks endpoint -- only maintenance and warden (AC-5)
router.get(
  '/maintenance-tasks',
  authMiddleware,
  requireRole('MAINTENANCE', 'WARDEN_ADMIN'),
  (req: Request, res: Response) => {
    const filter = buildVisibilityFilter(req.user!, 'assignedToMaintenance');
    res.json({ success: true, data: { filter } });
  },
);

export default router;
