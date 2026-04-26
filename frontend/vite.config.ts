import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export let BASE_API_URL: string;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  BASE_API_URL = env.BASE_API_URL;
  return {
    plugins: [react()],
    logLevel: "info",
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: env.BASE_API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
  };
});
