import { z } from 'zod';
import { LeaveType } from '../constants/leave-types.js';

export const createLeaveSchema = z.object({
  type: z.enum([LeaveType.DAY_OUTING, LeaveType.OVERNIGHT]),
  startDate: z.string().datetime({ offset: true }).refine(
    (val) => new Date(val) >= new Date(new Date().toDateString()),
    { message: 'Start date must be today or in the future' },
  ),
  endDate: z.string().datetime({ offset: true }),
  reason: z.string().min(5).max(500).trim(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be on or after start date', path: ['endDate'] },
);

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
