import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  category: z.enum(['MESS', 'LAUNDRY', 'ROOMS', 'MAINTENANCE', 'GENERAL']),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000).trim().optional(),
  isAnonymous: z.boolean().optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
