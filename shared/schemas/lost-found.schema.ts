import { z } from 'zod';

export const createLostFoundSchema = z.object({
  type: z.enum(['LOST', 'FOUND']),
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(100).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000).trim(),
  category: z.enum(['ELECTRONICS', 'CLOTHING', 'DOCUMENTS', 'ACCESSORIES', 'KEYS', 'WALLET', 'OTHER']),
  locationFound: z.string().optional(),
  dateOccurred: z.string().optional(),
  contactInfo: z.string().optional(),
});

export type CreateLostFoundInput = z.infer<typeof createLostFoundSchema>;
