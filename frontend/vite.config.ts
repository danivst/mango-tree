import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { BASE_API_URL } from "./src/utils/env";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: "info",
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: BASE_API_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
});
