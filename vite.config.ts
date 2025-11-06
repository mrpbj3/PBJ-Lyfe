import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  // Put the build artifacts at /dist (repo root)
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
