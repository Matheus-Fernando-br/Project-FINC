import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: sobe a API compilada servindo o front-end compilado (mesma origem, como em produção),
 * com banco PGlite descartável. Pré-requisito: `npm run build`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3399);
// E2E_BASE_URL aponta a suíte para uma instância já em execução (ex.: container Docker de produção).
const EXTERNO = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: EXTERNO ?? `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsivo\.spec\.ts/ },
  ],
  webServer: EXTERNO
    ? undefined
    : [
        {
          command: "node tests/e2e/viacep-stub.mjs",
          url: "http://127.0.0.1:3398/health",
          reuseExistingServer: false,
        },
        {
          command: `rm -rf .data/e2e && node apps/api/dist/server.js`,
          url: `http://127.0.0.1:${PORT}/api/health`,
          reuseExistingServer: false,
          timeout: 60_000,
          env: {
            NODE_ENV: "development",
            PORT: String(PORT),
            HOST: "127.0.0.1",
            DATABASE_URL: "pglite://./.data/e2e",
            SERVE_WEB: "true",
            APP_URL: `http://127.0.0.1:${PORT}`,
            LOG_LEVEL: "warn",
            RATE_LIMIT_DESATIVADO: "true",
            CERT_ENCRYPTION_KEY: "Bwk1v2+Xg8a6b5Q0j1mJr0m1wzN0bOQ5c2y7x9tZf3E=",
            SESSION_SECRET: "e2e-segredo-de-sessao-com-mais-de-32-caracteres",
            VIACEP_URL: "http://127.0.0.1:3398/ws",
          },
        },
      ],
});
