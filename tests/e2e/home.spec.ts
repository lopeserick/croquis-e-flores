import { expect, test } from "@playwright/test";

test.describe("página inicial", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("tem as seções do protótipo, na ordem", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Transforme suas memórias em arte.",
    );
    const headings = await page.locator("main h2").allTextContents();
    const expected = [
      "Nossas coleções",
      "Obras que contam histórias",
      "Como funciona",
      "Sua ideia, nossa arte.",
      "Quem já encomendou",
      "Carla Vitória",
    ];
    expect(headings).toEqual(expected);
  });

  test("como funciona: os 5 passos da Carla e o prazo", async ({ page }) => {
    const section = page.locator("#como-funciona");
    await expect(section.getByRole("listitem")).toHaveCount(5);
    await expect(section.getByText("Do primeiro rascunho à entrega, em até 15 dias corridos.")).toBeVisible();
  });

  test("depoimentos reais, sem nome e sem selo de demonstração", async ({ page }) => {
    const section = page.locator("section[aria-labelledby='depoimentos-titulo']");
    await expect(section.locator("figure")).toHaveCount(7);
    await expect(section.getByText(/Conteúdo demonstrativo/)).toHaveCount(0);
    await expect(section.getByText("Cliente Croquis e Flores").first()).toBeVisible();
  });

  test("coleção sem foto mostra o símbolo da marca", async ({ page }) => {
    const pets = page.getByRole("link", { name: /Pets/ }).first();
    await expect(pets.locator("svg")).toBeVisible();
  });

  test("todos os links internos abrem uma página existente", async ({ page, request }) => {
    const hrefs = await page.locator("a[href^='/']").evaluateAll((links) =>
      [...new Set(links.map((a) => a.getAttribute("href")!.split("#")[0] || "/"))],
    );
    expect(hrefs.length).toBeGreaterThan(10);
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });

  test("toda imagem tem texto alternativo definido", async ({ page }) => {
    const missing = await page.locator("img:not([alt])").count();
    expect(missing).toBe(0);
  });

  test("coleção leva à galeria filtrada", async ({ page }) => {
    await page.getByRole("link", { name: /Retratos/ }).first().click();
    await expect(page).toHaveURL(/\/galeria\/retratos$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Retratos");
  });

  test("busca envia para a galeria com o termo", async ({ page }) => {
    const search = page.getByRole("searchbox", { name: "Buscar obras" }).filter({ visible: true });
    test.skip((await search.count()) === 0, "no celular a busca fica dentro do menu");
    await search.fill("croqui");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/galeria\?q=croqui$/);
  });
});

test("rodapé tem WhatsApp, Instagram e e-mail do ateliê", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
    "href",
    "https://wa.me/5575988498356",
  );
  await expect(footer.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
    "href",
    "https://www.instagram.com/croquiseflores/",
  );
  await expect(footer.getByRole("link", { name: "croquiseflores@outlook.com" })).toHaveAttribute(
    "href",
    "mailto:croquiseflores@outlook.com",
  );
});

test.describe("vitrine de obras", () => {
  test("as setas avançam e voltam", async ({ page }) => {
    await page.goto("/");
    const prev = page.getByRole("button", { name: "Obras anteriores" });
    const next = page.getByRole("button", { name: "Próximas obras" });
    const track = page.getByRole("list", { name: "Obras em destaque" });

    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expect(prev).toBeEnabled();
  });
});

test.describe("cabeçalho", () => {
  test("desktop: menu marca a página atual", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "menu em linha só no desktop");
    await page.goto("/galeria");
    const nav = page.getByRole("navigation", { name: "Principal" });
    await expect(nav.getByRole("link", { name: "Galeria" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
  });

  test("celular: menu abre, navega e fecha com Esc", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "celular", "menu compacto só no celular");
    await page.goto("/");
    const openButton = page.getByRole("button", { name: "Abrir menu" });
    const menu = page.getByRole("dialog", { name: "Menu" });

    await expect(page.getByRole("link", { name: "Encomende já" }).first()).toBeVisible();
    await openButton.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(openButton).toBeFocused();

    await openButton.click();
    await menu.getByRole("link", { name: "Sobre a artista" }).click();
    await expect(page).toHaveURL(/\/sobre$/);
    await expect(menu).toBeHidden();
  });

  test("celular: busca dentro do menu", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "celular", "só no celular");
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const search = page.getByRole("dialog", { name: "Menu" }).getByRole("searchbox", { name: "Buscar obras" });
    await search.fill("retrato");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/galeria\?q=retrato$/);
  });

  test("link 'Pular para o conteúdo' é o primeiro do teclado", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
  });
});

test("endereço inexistente mostra a página 404 em português", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

test("obra inexistente mostra 'não encontrada' e não é indexada", async ({ page }) => {
  // Com pré-renderização parcial, endereços fora do generateStaticParams recebem
  // a casca da página antes do notFound(): o status pode ficar 200, mas o Next
  // mostra a página 404 e marca noindex (docs do Next: not-found > status codes).
  const response = await page.goto("/obra/nao-existe");
  expect([200, 404]).toContain(response?.status());
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});
