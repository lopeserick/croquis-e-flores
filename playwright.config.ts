import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  // Localmente, 1 nova tentativa: o `next dev` às vezes responde 500 ("Unexpected
  // end of JSON input") quando dois testes compilam a mesma rota dinâmica ao
  // mesmo tempo. Não ocorre no build de produção. Teste repetido sai como "flaky".
  retries: isCI ? 2 : 1,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  // Celular primeiro: a maior parte do público chega pelo Instagram e WhatsApp.
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // No CI testa o build de produção; localmente, o servidor de desenvolvimento.
    command: isCI ? `npm run build && npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
