import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
