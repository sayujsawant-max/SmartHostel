import { z } from 'zod';

export const createSosSchema = z.object({
  message: z.string().min(5, 'Message must be at least 5 characters').max(500).trim(),
});

export type CreateSosInput = z.infer<typeof createSosSchema>;
