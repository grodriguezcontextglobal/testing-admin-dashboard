import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
    include: ["src/**/*.test.{js,jsx}"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/config/**", "src/hooks/**", "src/store/**", "src/pages/**/utils/**"],
    },
  },
});
