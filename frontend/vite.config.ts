import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: "info",
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://192.168.0.21:3000",
        changeOrigin: true,
        secure: false,
        // Ensure the proxy rewrites the URL correctly
        rewrite: (path) => path,
      },
    },
  },
});
