import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4200",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [{
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      permissions: ["microphone"],
      launchOptions: {
        args: [
          "--use-fake-ui-for-media-stream",
          "--use-fake-device-for-media-stream"
        ]
      }
    }
  }],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "npm run start -w @eleanor/web",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
