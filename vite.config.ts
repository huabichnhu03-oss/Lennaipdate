import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Self-contained Vite config for Vercel deployment.
// - Builds the static SPA into `dist/public/`. Vercel serves this directly.
// - In dev, proxies `/api/*` to a local Express server (run `vercel dev` or
//   any local serverless emulator). On Vercel itself, the rewrite in
//   `vercel.json` routes `/api/*` to the serverless function.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Logo and any other static asset references resolve inside the
      // bundle so the export is fully self-contained.
      "@assets": path.resolve(import.meta.dirname, "src", "assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist", "public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
