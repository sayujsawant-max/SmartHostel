import { createServer } from 'node:http';
import { Sentry } from '@config/sentry.js';
import { env } from '@config/env.js';
import { connectDB } from '@config/db.js';
import { initSocket } from '@config/socket.js';
import { logger } from '@utils/logger.js';
import app from './app.js';

// Global handlers for truly unhandled errors
process.on('unhandledRejection', (reason) => {
  logger.fatal({ eventType: 'UNHANDLED_REJECTION', error: reason }, 'Unhandled promise rejection');
  Sentry.captureException(reason);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ eventType: 'UNCAUGHT_EXCEPTION', error: err }, 'Uncaught exception');
  Sentry.captureException(err);
  process.exit(1);
});

async function start(): Promise<void> {
  try {
    await connectDB();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(
        { eventType: 'SERVER_STARTED', port: env.PORT, env: env.NODE_ENV },
        `Server listening on port ${env.PORT}`,
      );
    });
  } catch (err) {
    logger.fatal({ eventType: 'STARTUP_FAILURE', error: err }, 'Failed to start server');
    Sentry.captureException(err);
    process.exit(1);
  }
}

start();
