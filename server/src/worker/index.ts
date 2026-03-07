import cron from 'node-cron';
import { connectDB } from '@config/db.js';
import { env } from '@config/env.js';
import { logger } from '@utils/logger.js';
import { runSlaCheck } from '@services/sla-worker.service.js';

async function start() {
  logger.info('SLA worker starting...');

  if (!env.CRON_ENABLED) {
    logger.info('CRON_ENABLED is false — worker exiting');
    return;
  }

  await connectDB();

  // Run SLA check every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    logger.info('Running SLA cron check...');
    void runSlaCheck();
  });

  // Also run immediately on startup
  void runSlaCheck();

  logger.info('SLA worker started — cron scheduled every 10 minutes');
}

start().catch((err) => {
  logger.fatal({ err }, 'SLA worker failed to start');
  process.exit(1);
});
