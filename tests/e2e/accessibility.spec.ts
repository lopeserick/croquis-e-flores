import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createUser, deleteUser, resetRateLimits, type TestUser } from "./support/db";
import { audit, login } from "./support/helpers";

// Auditoria automática (WCAG 2.1 A e AA): contraste, rótulos, estrutura.
// Não substitui o teste manual com teclado e leitor de tela.
const pages = [
  "/",
  "/galeria",
  "/galeria/retratos",
  "/galeria?q=nada-encontrado",
  "/obra/croqui-chapeu",
  "/tipos-de-obra",
  "/sobre",
  "/contato",
  "/encomendar",
  "/privacidade",
  "/termos",
];

for (const path of pages) {
  test(`sem problemas de acessibilidade detectáveis em ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
    );
    expect(summary).toEqual([]);
  });
}

test("menu do celular aberto também passa na auditoria", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "celular", "só no celular");
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const results = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

// Telas do painel (só leitura): auditoria e sem rolagem para o lado, no
// celular e no computador. A Carla vai usar o painel principalmente no celular.
test.describe("painel", () => {
  let carla: TestUser | undefined;
  test.beforeEach(async () => {
    await resetRateLimits();
    carla = await createUser("Carla Teste");
  });
  test.afterEach(async () => {
    await deleteUser(carla);
  });

  test("todas as telas passam na auditoria e cabem na largura da tela", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, carla!);
    await expect(page).toHaveURL(/\/admin$/);
    const paths = [
      "/admin",
      "/admin/pedidos",
      "/admin/obras",
      "/admin/obras/nova",
      "/admin/catalogo",
      "/admin/catalogo/modalidades/nova",
      "/admin/catalogo/colecoes/nova",
      "/admin/depoimentos",
      "/admin/depoimentos/novo",
      "/admin/textos",
      "/admin/configuracoes",
    ];
    for (const path of paths) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
      await audit(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} rola para o lado`).toBeLessThanOrEqual(0);
    }
  });
});
