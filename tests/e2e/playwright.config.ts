import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  timeout: 90_000,
  retries: 1,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:7500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
