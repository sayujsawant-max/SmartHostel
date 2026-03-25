import { createServer, type Server } from 'node:http';
import mongoose from 'mongoose';
import { Sentry } from '@config/sentry.js';
import { env } from '@config/env.js';
import { connectDB } from '@config/db.js';
import { disconnectCache } from '@config/cache.js';
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

/* ------------------------------------------------------------------ */
/*  Graceful shutdown                                                  */
/* ------------------------------------------------------------------ */

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function gracefulShutdown(httpServer: Server, signal: string): Promise<void> {
  logger.info({ eventType: 'SHUTDOWN_START', signal }, `Received ${signal}, shutting down gracefully`);

  // Force-exit safety net
  const forceTimer = setTimeout(() => {
    logger.error({ eventType: 'SHUTDOWN_FORCED' }, 'Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  try {
    // 1. Stop accepting new connections
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info({ eventType: 'SHUTDOWN_HTTP_CLOSED' }, 'HTTP server closed');

    // 2. Close cache connection
    await disconnectCache();

    // 3. Close database connection
    await mongoose.disconnect();
    logger.info({ eventType: 'SHUTDOWN_DB_CLOSED' }, 'Database disconnected');

    // 4. Flush Sentry events
    await Sentry.close(2000);

    logger.info({ eventType: 'SHUTDOWN_COMPLETE' }, 'Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ eventType: 'SHUTDOWN_ERROR', error: err }, 'Error during shutdown');
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Start                                                              */
/* ------------------------------------------------------------------ */

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

    // Register shutdown handlers
    for (const signal of ['SIGTERM', 'SIGINT'] as const) {
      process.on(signal, () => gracefulShutdown(httpServer, signal));
    }
  } catch (err) {
    logger.fatal({ eventType: 'STARTUP_FAILURE', error: err }, 'Failed to start server');
    Sentry.captureException(err);
    process.exit(1);
  }
}

start();
