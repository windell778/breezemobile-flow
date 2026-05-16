import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        launchOptions: {
          executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
  // Start the Next.js dev server before running tests.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
