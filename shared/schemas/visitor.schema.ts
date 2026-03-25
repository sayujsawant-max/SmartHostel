import { z } from 'zod';

export const registerVisitorSchema = z.object({
  visitorName: z.string().min(2, 'Visitor name must be at least 2 characters').max(100).trim(),
  visitorPhone: z.string().min(1, 'Phone number is required').trim(),
  relationship: z.string().min(2).max(50).trim(),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(500).trim(),
  expectedDate: z.string().min(1, 'Expected date is required'),
  expectedTime: z.string().optional(),
});

export type RegisterVisitorInput = z.infer<typeof registerVisitorSchema>;
