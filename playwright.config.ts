import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: process.env.BIONIC_LIVE_URL || 'http://localhost:53117',
    trace: 'retain-on-failure',
    viewport: { width: 1600, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } } },
  ],
  webServer: process.env.BIONIC_LIVE_URL ? undefined : {
    command: process.env.BIONIC_PRODUCTION_CHECK
      ? 'npm run preview -- --port 53117 --strictPort'
      : 'npm run dev -- --port 53117 --strictPort',
    url: 'http://localhost:53117',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
