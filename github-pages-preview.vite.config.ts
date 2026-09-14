import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "github-pages-preview"),
  base: "/hotel-social-report/",
  plugins: [react()],
  resolve: {
    alias: {
      "next/link": path.resolve(import.meta.dirname, "github-pages-preview/next-link.tsx"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "docs"),
    emptyOutDir: true,
  },
});
