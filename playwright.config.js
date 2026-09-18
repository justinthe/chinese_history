import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/chinese_history/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:4173/chinese_history/',
  },
});
