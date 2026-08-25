import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./web/src", import.meta.url)),
    },
  },
  test: {
    include: ["shared/src/__tests__/**/*.test.ts", "web/src/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
