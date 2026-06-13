import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Unit / component tests. E2E lives under e2e/ and runs via Playwright
// (`npm run test:e2e`), not Vitest.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
