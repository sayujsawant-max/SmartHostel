import { z } from 'zod';
import { Role } from '../constants/roles.js';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum([Role.STUDENT, Role.WARDEN_ADMIN, Role.GUARD, Role.MAINTENANCE]),
  block: z.string().optional(),
  floor: z.string().optional(),
  roomNumber: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
