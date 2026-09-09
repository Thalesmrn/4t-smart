import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // O proxy só é usado em desenvolvimento (`npm run dev`) e nunca entra
      // no build de produção. Se VITE_API_URL estiver definida no .env local,
      // ela é usada como alvo; caso contrário, cai no backend local padrão.
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
