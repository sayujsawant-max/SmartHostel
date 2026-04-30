import { z } from 'zod';

export const RESOURCE_KEY_REGEX = /^[A-Z][A-Z0-9_]{0,39}$/;
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const resourceSlotTemplateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(HHMM_REGEX, 'Use HH:MM (24h)'),
  durationMinutes: z.number().int().min(15).max(480),
});

export const resourceRoleSchema = z.enum(['STUDENT', 'WARDEN_ADMIN', 'GUARD', 'MAINTENANCE']);

export const createResourceSchema = z.object({
  key: z.string().regex(RESOURCE_KEY_REGEX, 'Use UPPER_SNAKE_CASE'),
  label: z.string().min(1).max(80).trim(),
  description: z.string().max(500).trim().optional(),
  icon: z.string().max(40).trim().optional(),
  slots: z.array(resourceSlotTemplateSchema).min(1).max(50),
  capacity: z.number().int().min(1).max(500),
  allowedRoles: z.array(resourceRoleSchema).min(1).default(['STUDENT']),
  bookingWindowDays: z.number().int().min(1).max(90).default(14),
  isActive: z.boolean().default(true),
});

export const updateResourceSchema = createResourceSchema.partial().omit({ key: true });

export const bookSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  slotIndex: z.number().int().min(0),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceSlotTemplate = z.infer<typeof resourceSlotTemplateSchema>;
export type BookSlotInput = z.infer<typeof bookSlotSchema>;
