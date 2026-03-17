import { z } from 'zod';

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const AcademicYear = {
  FIRST: '1',
  SECOND: '2',
  THIRD: '3',
  FOURTH: '4',
} as const;

export type AcademicYear = (typeof AcademicYear)[keyof typeof AcademicYear];

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'Please select your gender' }),
  academicYear: z.enum(['1', '2', '3', '4'], { message: 'Please select your academic year' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
