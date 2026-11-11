import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
