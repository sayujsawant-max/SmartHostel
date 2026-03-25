import { z } from 'zod';

export const updateMessMenuSchema = z.object({
  breakfast: z.array(z.string().trim().min(1)).min(1, 'At least one breakfast item is required'),
  lunch: z.array(z.string().trim().min(1)).min(1, 'At least one lunch item is required'),
  snacks: z.array(z.string().trim().min(1)).min(1, 'At least one snacks item is required'),
  dinner: z.array(z.string().trim().min(1)).min(1, 'At least one dinner item is required'),
});

export type UpdateMessMenuInput = z.infer<typeof updateMessMenuSchema>;

export const rateMenuSchema = z.object({
  meal: z.enum(['breakfast', 'lunch', 'snacks', 'dinner']),
  rating: z.enum(['up', 'down']),
});

export type RateMenuInput = z.infer<typeof rateMenuSchema>;
