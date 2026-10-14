import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  // Destino das chamadas /api no `npm run dev`: API local (padrão) ou o back-end no Render.
  // Pode vir do terminal ou de apps/web/.env.local (VITE_API_PROXY=https://project-finc.onrender.com).
  const destino =
    process.env.VITE_API_PROXY ||
    loadEnv(mode, process.cwd(), "VITE_").VITE_API_PROXY ||
    "http://localhost:3333";
  const proxy = { "/api": { target: destino, changeOrigin: true } };
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: { react: ["react", "react-dom", "react-router-dom"], charts: ["recharts"] },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
    },
  };
});
