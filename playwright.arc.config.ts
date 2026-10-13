import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: ["arc.spec.ts", "assembly.spec.ts"],
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: { baseURL: process.env.ARC_TEST_BASE_URL || "http://127.0.0.1:3120", channel: "msedge", trace: "retain-on-failure" },
  reporter: "list",
});
