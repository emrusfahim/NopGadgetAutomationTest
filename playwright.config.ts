import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({

  // timeout: 120000,  // 2 minutes for each test
  /* Start StorageState */
  globalSetup: require.resolve('./global-setup'),
  // use: {
  //   // Apply storage state to all tests
  //   storageState: 'storageState.json'
  // },
  /* End StorageState */



  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: parseInt(process.env.RETRIES!),
  /* Opt out of parallel tests on CI. */
  workers: parseInt(process.env.WORKERS!),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.REPORTER!,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL!,
    // storageState: 'storageState.json', // Remove from global use

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.TRACE! as 'on' | 'off' | 'retain-on-failure' | 'on-first-retry',
    screenshot: process.env.SCREENSHOT! as 'off' | 'only-on-failure' | 'on',
    video: process.env.VIDEO! as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: process.env.STORAGE_STATE_PATH!
      },
    },

    // {
    //   name: 'firefox',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     storageState: process.env.STORAGE_STATE_PATH || 'storageState.json'
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     storageState: process.env.STORAGE_STATE_PATH || 'storageState.json'
    //   },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});