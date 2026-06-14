import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: 'http://localhost:53117',
    trace: 'retain-on-failure',
    viewport: { width: 1600, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } } },
  ],
  webServer: {
    command: 'npm run dev -- --port 53117 --strictPort',
    url: 'http://localhost:53117',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
