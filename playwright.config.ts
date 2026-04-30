import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace=server',
      port: 5000,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      // Bypass auth rate limiters for E2E runs: Playwright drives many login
      // attempts per session (warden + student per test, plus retries) which
      // otherwise trips the 10-per-15-min auth limit and breaks every test.
      env: { E2E_BYPASS_RATE_LIMIT: 'true' },
    },
    {
      command: 'npm run dev --workspace=client',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
