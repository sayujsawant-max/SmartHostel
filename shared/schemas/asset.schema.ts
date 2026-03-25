import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  assetTag: z.string().min(2, 'Asset tag must be at least 2 characters').max(50).trim(),
  category: z.enum(['FURNITURE', 'ELECTRICAL', 'PLUMBING', 'IT_EQUIPMENT', 'OTHER']),
  location: z.object({
    block: z.string().min(1).trim(),
    floor: z.string().min(1).trim(),
    room: z.string().min(1).trim(),
  }),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
