import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '@utils/logger.js';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    logger.info({ eventType: 'DB_CONNECTED' }, 'MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ eventType: 'DB_ERROR', error: err.message }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn({ eventType: 'DB_DISCONNECTED' }, 'MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
}
