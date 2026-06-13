import { defineConfig, devices } from '@playwright/test';

// E2E for critical user workflows. Auto-starts the Vite dev server.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: 'http://localhost:53117',
    trace: 'retain-on-failure',
    // ≥1440px so the full toolbar (inline sliders, swap button) is shown
    // rather than the minimal toolbar + settings panel.
    viewport: { width: 1600, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } } },
  ],
  webServer: {
    command: 'npm run dev -- --port 53117 --strictPort',
    url: 'http://localhost:53117',
    // Always start our own server — never reuse whatever happens to be on the
    // port (the dev box runs several apps), so tests can't hit the wrong app.
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
