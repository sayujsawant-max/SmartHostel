import { createServer } from 'node:http';
import { env } from '@config/env.js';
import { connectDB } from '@config/db.js';
import { initSocket } from '@config/socket.js';
import { logger } from '@utils/logger.js';
import app from './app.js';

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
    process.exit(1);
  }
}

start();
