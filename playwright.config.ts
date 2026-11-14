import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = Boolean(process.env.CI);
const PANEL_WRITES = /painel-.*\.spec\.ts/;

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
    { name: "celular", use: { ...devices["Pixel 7"] }, testIgnore: PANEL_WRITES },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: PANEL_WRITES },
    // Testes que mudam o conteúdo do site pelo painel (obras, catálogo, textos)
    // rodam por último, para não alterar o que os outros testes estão conferindo.
    // Rodar só eles: npx playwright test --project=painel --no-deps
    { name: "painel", use: { ...devices["Desktop Chrome"] }, testMatch: PANEL_WRITES, dependencies: ["celular", "desktop"] },
  ],
  webServer: {
    // No CI testa o build de produção; localmente, o servidor de desenvolvimento.
    command: isCI ? `npm run build && npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    // Os testes enviam pedidos: sem isto, cada rodada mandaria e-mails de verdade.
    // Variável já definida (mesmo vazia) vale mais que o .env.local.
    // Para testar o envio real: E2E_SEND_EMAIL=1 npm run test:e2e
    env: process.env.E2E_SEND_EMAIL ? {} : { RESEND_API_KEY: "" },
  },
});
