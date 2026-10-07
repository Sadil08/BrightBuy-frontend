import { defineConfig } from "@playwright/test";


// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      url: "http://127.0.0.1:8081/healthz",
      reuseExistingServer: true,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      env: { BACKEND_URL: "http://127.0.0.1:8081" },
    },
  ],
});