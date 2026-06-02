import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src", "assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    reportCompressedSize: false,
    rollupOptions: {
      external: ["pg", "cloudinary", "resend", "formidable"],
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
          "vendor-wouter": ["wouter"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: "localhost",
  },
  preview: {
    port: 4173,
    host: "localhost",
  },
});
