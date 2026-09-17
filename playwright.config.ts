import { defineConfig, devices } from '@playwright/test';
import { config } from './config/config';

const chrome = { ...devices['Desktop Chrome'], channel: 'chrome' as const };

export default defineConfig({
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['allure-playwright', { resultsDir: 'allure-results' }]],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'e2e', testDir: 'tests/e2e', use: { ...chrome, baseURL: config.baseUrl } },
  ],
});
