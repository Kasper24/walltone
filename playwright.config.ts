import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: false, // Electron apps should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Run Electron tests one at a time
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/e2e-results.json" }],
    ["junit", { outputFile: "test-results/e2e-results.xml" }],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  expect: {
    timeout: 10000,
  },
  timeout: 60000,
  projects: [
    {
      name: "electron",
      use: {
        ...devices["Desktop Chrome"],
        // Electron-specific configuration
        launchOptions: {
          // Add any electron-specific launch options here
        },
      },
    },
  ],
  outputDir: "test-results/",
});
