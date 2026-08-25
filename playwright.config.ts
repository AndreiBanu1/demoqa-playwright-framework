import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',

  timeout: 60_000,
  expect: { timeout: 15_000 },

  fullyParallel: true,
  workers: 4,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demoqa.com',
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'api',
      testDir: './src/tests/api',
      testMatch: /.*\.api\.spec\.ts$/,
    },
    {
      name: 'ui',
      testDir: './src/tests/ui',
      testMatch: /.*\.ui\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
