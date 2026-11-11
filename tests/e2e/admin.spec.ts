import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  createTestOrder,
  createUser,
  deleteOrdersOf,
  deleteUser,
  resetRateLimits,
  type TestUser,
} from "./support/db";

// Painel: login e pedidos (entrega 7), contra o Supabase de desenvolvimento.
// Contas e pedidos de teste são criados e apagados por teste.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

async function login(page: Page, user: TestUser) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.beforeEach(async () => {
  await resetRateLimits();
});

test.describe("sem login", () => {
  for (const path of ["/admin", "/admin/pedidos", "/admin/pedidos/00000000-0000-4000-8000-000000000000"]) {
    test(`${path} manda para o login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole("heading", { name: "Painel da artista" })).toBeVisible();
    });
  }

  test("foto de cliente não abre por chamada direta", async ({ request }) => {
    const response = await request.get(`/api/admin/referencias/${randomUUID()}`, { maxRedirects: 0 });
    expect(response.status()).toBe(401);
  });

  test("página de login passa na auditoria de acessibilidade e fica fora dos buscadores", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await audit(page);
  });

  test("senha errada mostra mensagem que não revela se o e-mail existe", async ({ page }) => {
    await login(page, { id: "", email: "ninguem@exemplo.com", password: "senha-errada-123" });
    await expect(page.locator("main [role=alert]")).toHaveText("E-mail ou senha incorretos.");
    await expect(page.getByLabel("E-mail")).toHaveValue("ninguem@exemplo.com");
  });
});

test.describe("conta que não é admin", () => {
  let user: TestUser | undefined;
  test.beforeEach(async () => {
    user = await createUser();
  });
  test.afterEach(async () => {
    await deleteUser(user);
  });

  test("não entra no painel nem abre fotos", async ({ page }) => {
    await login(page, user!);
    await expect(page.locator("main [role=alert]")).toHaveText("Esta conta não tem acesso ao painel.");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Carla logada", () => {
  let carla: TestUser | undefined;
  let customer = "";
  let order: { id: string; number: string };

  test.beforeEach(async () => {
    carla = await createUser("Carla Teste");
    customer = `e2e-${randomUUID().slice(0, 8)}@exemplo.com`;
    order = await createTestOrder(customer, PNG);
  });
  test.afterEach(async () => {
    await deleteOrdersOf(customer);
    await deleteUser(carla);
  });

  test("vê o pedido, a foto, muda o status e registra orçamento, prazo e anotação", async ({ page }) => {
    await login(page, carla!);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Carla!");
    await audit(page);

    await page.getByRole("link", { name: "Pedidos", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedidos");
    await page.getByRole("link", { name: new RegExp(order.number) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cliente Teste Painel");
    await expect(page.getByText("Ilustração digital", { exact: true })).toBeVisible();
    await expect(page.getByText("segunda-feira, 15 de março de 2027")).toBeVisible();

    // A foto abre pela rota do painel (link assinado de 1 minuto).
    const photo = page.getByRole("img", { name: /Foto de referência 1: familia\.png/ });
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const whatsapp = page.getByRole("link", { name: /WhatsApp \(11\) 91234-5678/ });
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/5511912345678\?text=/);
    await audit(page);

    await page.getByLabel("Status do pedido").selectOption("em_analise");
    await page.getByRole("button", { name: "Salvar status" }).click();
    await expect(page.getByText('Status alterado para "Em análise".')).toBeVisible();
    const history = page.locator("section[aria-labelledby='historico']");
    await expect(history.getByText("Status: Nova → Em análise")).toBeVisible();

    await page.getByLabel("Valor do orçamento (R$)").fill("150,00");
    await page.getByLabel("Prazo confirmado").fill("2027-03-10");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(history.getByText("Orçamento: R$ 150,00. Prazo confirmado: 10/03/2027.")).toBeVisible();

    await page.getByLabel("Anotação interna").fill("Cliente prefere tons de laranja.");
    await page.getByRole("button", { name: "Salvar anotação" }).click();
    await expect(history.getByText("Cliente prefere tons de laranja.")).toBeVisible();
    await expect(page.getByLabel("Anotação interna")).toHaveValue("");

    // Sair encerra a sessão de verdade.
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto(`/admin/pedidos/${order.id}`);
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("filtro por status e aviso de e-mail não enviado", async ({ page }) => {
    await login(page, carla!);
    await expect(page).toHaveURL(/\/admin$/);
    // Nos testes o envio de e-mail fica desligado: o pedido criado direto no banco está "pendente".
    await page.goto("/admin/pedidos?status=nova");
    await expect(page.getByRole("link", { name: new RegExp(order.number) })).toBeVisible();
    await page.goto("/admin/pedidos?status=concluido");
    await expect(page.getByRole("link", { name: new RegExp(order.number) })).toHaveCount(0);

    await page.goto(`/admin/pedidos/${order.id}`);
    await page.getByRole("button", { name: "Reenviar e-mail" }).click();
    await expect(page.getByText("O e-mail não foi enviado. O motivo está no histórico.")).toBeVisible();
    await expect(page.locator("section[aria-labelledby='historico']").getByText(/E-mail não enviado/)).toBeVisible();
  });
});
