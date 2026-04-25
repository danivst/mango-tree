import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    logLevel: "info",
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          // Access the variable from the 'env' object created above
          target: env.BASE_API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
  };
});
