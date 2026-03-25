import { Router, type Request, type Response } from 'express';
import { Role, updateMessMenuSchema, rateMenuSchema } from '@smarthostel/shared';
import { authMiddleware } from '@middleware/auth.middleware.js';
import { requireRole } from '@middleware/rbac.middleware.js';
import { validate } from '@middleware/validate.middleware.js';
import { MessMenu } from '@models/mess-menu.model.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/cache.js';

const router = Router();

router.use(authMiddleware);

// GET / — Returns all 7 days' menus with aggregated ratings
router.get('/', async (_req: Request, res: Response) => {
  const cached = await cacheGet<{ menus: unknown[] }>('mess-menus:all');
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const menus = await MessMenu.find({ isActive: true }).sort({ dayOfWeek: 1 }).lean();

  const result = menus.map((menu) => {
    const meals = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
    const ratings: Record<string, { up: number; down: number }> = {};

    for (const meal of meals) {
      const mealRatings = menu.ratings?.filter((r) => r.meal === meal) ?? [];
      ratings[meal] = {
        up: mealRatings.filter((r) => r.rating === 'up').length,
        down: mealRatings.filter((r) => r.rating === 'down').length,
      };
    }

    return {
      _id: menu._id,
      dayOfWeek: menu.dayOfWeek,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      snacks: menu.snacks,
      dinner: menu.dinner,
      ratings,
    };
  });

  const data = { menus: result };
  await cacheSet('mess-menus:all', data, 300);
  res.json({ success: true, data });
});

// GET /today — Returns today's menu
router.get('/today', async (_req: Request, res: Response) => {
  const today = new Date().getDay();
  const cacheKey = `mess-menus:today:${today}`;

  const cached = await cacheGet<{ menu: unknown }>(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const menu = await MessMenu.findOne({ dayOfWeek: today, isActive: true }).lean();

  if (!menu) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No menu found for today' } });
    return;
  }

  const meals = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
  const ratings: Record<string, { up: number; down: number }> = {};

  for (const meal of meals) {
    const mealRatings = menu.ratings?.filter((r) => r.meal === meal) ?? [];
    ratings[meal] = {
      up: mealRatings.filter((r) => r.rating === 'up').length,
      down: mealRatings.filter((r) => r.rating === 'down').length,
    };
  }

  const data = {
    menu: {
      _id: menu._id,
      dayOfWeek: menu.dayOfWeek,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      snacks: menu.snacks,
      dinner: menu.dinner,
      ratings,
    },
  };
  await cacheSet(cacheKey, data, 300);
  res.json({ success: true, data });
});

// PUT /:dayOfWeek — Warden updates a day's menu (upsert)
router.put('/:dayOfWeek', requireRole(Role.WARDEN_ADMIN), validate(updateMessMenuSchema), async (req: Request, res: Response) => {
  const dayOfWeek = Number(req.params.dayOfWeek);
  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'dayOfWeek must be 0-6' } });
    return;
  }

  const { breakfast, lunch, snacks, dinner } = req.body;
  if (!breakfast || !lunch || !snacks || !dinner) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'All meal fields are required' } });
    return;
  }

  const menu = await MessMenu.findOneAndUpdate(
    { dayOfWeek },
    { $set: { breakfast, lunch, snacks, dinner, isActive: true } },
    { upsert: true, new: true },
  );

  await cacheDelPattern('mess-menus:*');
  res.json({ success: true, data: { menu } });
});

// POST /:dayOfWeek/rate — Student rates a meal
router.post('/:dayOfWeek/rate', requireRole(Role.STUDENT), validate(rateMenuSchema), async (req: Request, res: Response) => {
  const dayOfWeek = Number(req.params.dayOfWeek);
  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'dayOfWeek must be 0-6' } });
    return;
  }

  const { meal, rating } = req.body;
  const validMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const validRatings = ['up', 'down'];

  if (!validMeals.includes(meal) || !validRatings.includes(rating)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid meal or rating value' } });
    return;
  }

  const studentId = req.user!._id;

  // Remove existing rating for this student+meal, then add the new one
  await MessMenu.updateOne(
    { dayOfWeek, isActive: true },
    { $pull: { ratings: { studentId, meal } } },
  );

  const menu = await MessMenu.findOneAndUpdate(
    { dayOfWeek, isActive: true },
    { $push: { ratings: { studentId, meal, rating } } },
    { new: true },
  );

  if (!menu) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Menu not found for this day' } });
    return;
  }

  await cacheDelPattern('mess-menus:*');
  res.json({ success: true, data: { message: 'Rating recorded' } });
});

export default router;
