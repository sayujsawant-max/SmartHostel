import { execSync } from 'node:child_process';

/**
 * Playwright globalSetup — runs the seed script before E2E tests
 * to ensure seed users and reference data exist in the database.
 */
export default function globalSetup() {
  console.log('[E2E] Running database seed...');
  execSync('npm run seed --workspace=server', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('[E2E] Seed complete.');
}
