import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API = process.env.API_URL || "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: API, changeOrigin: true },
      "/uploads": { target: API, changeOrigin: true },
      "/socket.io": { target: API, ws: true, changeOrigin: true },
    },
  },
});
