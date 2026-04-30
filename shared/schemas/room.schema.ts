import { z } from 'zod';
import { RoomAcType, HostelGender } from '../constants/room-types.js';

export const createRoomSchema = z.object({
  block: z.string().min(1).max(50).trim(),
  floor: z.string().min(1).max(20).trim(),
  roomNumber: z.string().min(1).max(20).trim(),
  hostelGender: z.enum([HostelGender.BOYS, HostelGender.GIRLS]),
  roomType: z.string().min(1).max(40).regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, numbers, and underscores'),
  acType: z.enum([RoomAcType.AC, RoomAcType.NON_AC]),
  totalBeds: z.number().int().min(1).max(10),
  feePerSemester: z.number().min(0),
  photos: z.array(z.string().url()).max(5).default([]),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
