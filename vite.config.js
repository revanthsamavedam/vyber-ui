import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api is proxied to the vyber backend (separate repo),
// so the browser sees one origin. In production, set VITE_API_URL to the
// API's origin and add that origin to the API's VYBER_CORS_ORIGINS.
const proxy = {
  "/api": "http://localhost:8091",
  "/healthz": "http://localhost:8091",
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
