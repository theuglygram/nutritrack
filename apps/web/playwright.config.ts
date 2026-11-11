import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Set E2E_BASE_URL to test an already-running server (e.g. `next dev`) instead of a build.
const external = process.env.E2E_BASE_URL;

/**
 * End-to-end tests against a production build and the local Supabase stack.
 * Run with `pnpm --filter @nutritrack/web test:e2e` (needs `pnpm db:start`).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: external ?? `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: external
    ? undefined
    : {
        command: `pnpm exec next start --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}/sign-in`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
