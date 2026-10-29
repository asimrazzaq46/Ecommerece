import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:3002", "/robots.txt": "http://127.0.0.1:3002", "/sitemap.xml": "http://127.0.0.1:3002" }, // UPDATED: SEO files come from the API
  },
  build: { outDir: "build" },
});
