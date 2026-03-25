import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  message: z.string().min(1, 'Message cannot be empty').max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
