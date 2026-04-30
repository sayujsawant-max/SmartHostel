import { execSync } from 'node:child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';

/**
 * Playwright globalSetup — runs the seed script before E2E tests
 * to ensure seed users and reference data exist in the database, and
 * drops the HostelConfig singleton so the lazy-seed re-creates defaults
 * on the first GET. This keeps tests independent across runs.
 */
export default async function globalSetup() {
  console.log('[E2E] Running database seed...');
  execSync('npm run seed --workspace=server', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('[E2E] Seed complete.');

  // Drop the HostelConfig singleton so each run starts with default branding,
  // names, room-type prices, and feature flags.
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.collection('hostel_configs').deleteMany({});
    console.log('[E2E] HostelConfig reset.');
    await mongoose.disconnect();
  }
}
