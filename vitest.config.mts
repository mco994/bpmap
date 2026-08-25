import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["shared/src/__tests__/**/*.test.ts", "web/src/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
