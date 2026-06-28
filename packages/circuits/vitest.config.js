import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    testTimeout: 120000, // circuit compile + proof gen is slow
    hookTimeout: 120000,
  },
});
