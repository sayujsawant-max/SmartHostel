import { z } from 'zod';
import { ComplaintCategory } from '../constants/complaint-category.js';

export const createComplaintSchema = z.object({
  category: z.enum(Object.values(ComplaintCategory) as [string, ...string[]]),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000).trim(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
