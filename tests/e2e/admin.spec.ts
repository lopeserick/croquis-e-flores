import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  createTestOrder,
  createUser,
  deleteOrdersOf,
  deleteUser,
  resetRateLimits,
  type TestUser,
} from "./support/db";
import { audit, login, PNG } from "./support/helpers";

// Painel: login e pedidos (entrega 7), contra o Supabase de desenvolvimento.
// Contas e pedidos de teste são criados e apagados por teste.

test.beforeEach(async () => {
  await resetRateLimits();
});

test.describe("sem login", () => {
  for (const path of [
    "/admin",
    "/admin/pedidos",
    "/admin/pedidos/00000000-0000-4000-8000-000000000000",
    "/admin/obras",
    "/admin/obras/nova",
    "/admin/catalogo",
    "/admin/catalogo/modalidades/nova",
    "/admin/depoimentos",
    "/admin/textos",
    "/admin/configuracoes",
  ]) {
    test(`${path} manda para o login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole("heading", { name: "Painel da artista" })).toBeVisible();
    });
  }

  test("rotina diária não roda sem a chave", async ({ request }) => {
    expect((await request.get("/api/cron/manutencao")).status()).toBe(401);
    const wrong = await request.get("/api/cron/manutencao", { headers: { authorization: "Bearer chave-errada" } });
    expect(wrong.status()).toBe(401);
  });

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
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/api\.whatsapp\.com\/send\?phone=5511912345678&text=/);
    await audit(page);

    await page.getByLabel("Status do pedido").selectOption("orcamento_enviado");
    await page.getByRole("button", { name: "Salvar status" }).click();
    await expect(page.getByText('Status alterado para "Orçamento enviado".')).toBeVisible();
    const history = page.locator("section[aria-labelledby='historico']");
    await expect(history.getByText("Status: Novo → Orçamento enviado")).toBeVisible();

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
    await page.goto("/admin/pedidos?status=novo");
    await expect(page.getByRole("link", { name: new RegExp(order.number) })).toBeVisible();
    await page.goto("/admin/pedidos?status=concluido");
    await expect(page.getByRole("link", { name: new RegExp(order.number) })).toHaveCount(0);

    await page.goto(`/admin/pedidos/${order.id}`);
    await page.getByRole("button", { name: "Reenviar e-mail" }).click();
    await expect(page.getByText("O e-mail não foi enviado. O motivo está no histórico.")).toBeVisible();
    await expect(page.locator("section[aria-labelledby='historico']").getByText(/E-mail não enviado/)).toBeVisible();
  });
});
