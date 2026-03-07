import { Router, type Request, type Response } from 'express';
import { Role } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import mongoose from 'mongoose';
import { LostFound } from '@models/lost-found.model.js';

const router = Router();

router.use(authMiddleware);

// POST / — Create a lost/found post
router.post(
  '/',
  requireRole(Role.STUDENT, Role.WARDEN_ADMIN),
  async (req: Request, res: Response) => {
    const { type, itemName, description, category, locationFound, dateOccurred, contactInfo } =
      req.body;
    const post = await LostFound.create({
      postedBy: req.user!._id,
      type,
      itemName,
      description,
      category,
      locationFound,
      dateOccurred,
      contactInfo,
    });
    res.status(201).json({ success: true, data: post });
  },
);

// GET / — Get all posts with optional filters
router.get('/', async (req: Request, res: Response) => {
  const filter: Record<string, string> = {};
  if (req.query.type) filter.type = req.query.type as string;
  if (req.query.status) filter.status = req.query.status as string;
  if (req.query.category) filter.category = req.query.category as string;

  const posts = await LostFound.find(filter)
    .populate('postedBy', 'name block roomNumber')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: posts });
});

// GET /my — Get current user's own posts
router.get('/my', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const posts = await LostFound.find({ postedBy: req.user!._id })
    .populate('postedBy', 'name block roomNumber')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: posts });
});

// PATCH /:id/claim — Claim an item
router.patch('/:id/claim', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const post = await LostFound.findById(req.params.id);
  if (!post) {
    res
      .status(404)
      .json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return;
  }
  if (post.status !== 'ACTIVE') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Only active items can be claimed' },
    });
    return;
  }
  if (post.postedBy.toString() === req.user!._id.toString()) {
    res.status(400).json({
      success: false,
      error: { code: 'OWN_POST', message: 'You cannot claim your own post' },
    });
    return;
  }
  post.status = 'CLAIMED';
  post.claimedBy = new mongoose.Types.ObjectId(req.user!._id);
  post.claimedAt = new Date();
  await post.save();
  res.json({ success: true, data: post });
});

// PATCH /:id/return — Mark item as returned
router.patch(
  '/:id/return',
  requireRole(Role.STUDENT, Role.WARDEN_ADMIN),
  async (req: Request, res: Response) => {
    const post = await LostFound.findById(req.params.id);
    if (!post) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    const isOwner = post.postedBy.toString() === req.user!._id.toString();
    const isWarden = req.user!.role === Role.WARDEN_ADMIN;
    if (!isOwner && !isWarden) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the poster or a warden can mark as returned' },
      });
      return;
    }
    post.status = 'RETURNED';
    await post.save();
    res.json({ success: true, data: post });
  },
);

// DELETE /:id — Soft delete (set status to EXPIRED)
router.delete(
  '/:id',
  requireRole(Role.STUDENT, Role.WARDEN_ADMIN),
  async (req: Request, res: Response) => {
    const post = await LostFound.findById(req.params.id);
    if (!post) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    const isOwner = post.postedBy.toString() === req.user!._id.toString();
    const isWarden = req.user!.role === Role.WARDEN_ADMIN;
    if (!isOwner && !isWarden) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own posts' },
      });
      return;
    }
    post.status = 'EXPIRED';
    await post.save();
    res.json({ success: true, data: post });
  },
);

export default router;
