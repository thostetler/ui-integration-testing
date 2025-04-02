import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : '50%',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    bypassCSP: true,
    video: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      stylePath: 'tests/util/screenshots.css',
      maxDiffPixelRatio: 0.1,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'perf-auth', testMatch: /auth.setup\.ts/ },
    // { name: 'setup-accounts', testMatch: /accounts.setup\.ts/ },
    {
      name: 'perf',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['perf-auth'],
      testMatch: '**/perf/**',
      grep: /@perf/,
    },
    {
      name: 'ads',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-gl=egl'],
        },
      },
      testIgnore: '**/perf/**',
      grepInvert: /@stress/,
      testDir: './tests/ads',
    },
    {
      name: 'scix',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-gl=egl'],
        },
      },
      testIgnore: '**/perf/**',
      grepInvert: /@stress/,
      testDir: './tests/scix',
    },
  ],
});
