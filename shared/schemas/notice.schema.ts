import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000).trim(),
  target: z.enum(['ALL', 'BLOCK', 'FLOOR']),
  targetBlock: z.string().optional(),
  targetFloor: z.string().optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
