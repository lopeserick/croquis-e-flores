import { expect, test } from "@playwright/test";
import { normalizeText } from "@/lib/text";
import { foundText, visibleArtworks, type VisibleArtwork } from "./support/db";

// Galeria, filtros, busca, página da obra e SEO (entrega 4). As quantidades
// esperadas vêm do banco (o que um visitante pode ver), então os testes não
// quebram quando a Carla cadastra, arquiva ou muda obras pelo painel. A obra
// provisória "croqui-chapeu" do seed é usada como exemplo fixo.

const count = (page: import("@playwright/test").Page) => page.getByRole("status").filter({ hasText: /encontrada/ });
const matches = (a: VisibleArtwork, query: string) =>
  normalizeText(query)
    .split(" ")
    .every((term) => normalizeText(a.text).includes(term));

let all: VisibleArtwork[] = [];
test.beforeAll(async () => {
  all = await visibleArtworks();
});

test.describe("galeria", () => {
  test("filtro de coleção leva ao endereço da coleção", async ({ page }) => {
    await page.goto("/galeria");
    await expect(count(page)).toHaveText(foundText(all.length));
    await page.getByRole("navigation", { name: "Coleção" }).getByRole("link", { name: "Retratos" }).click();
    await expect(page).toHaveURL(/\/galeria\/retratos$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Retratos");
    await expect(count(page)).toHaveText(foundText(all.filter((a) => a.category === "retratos").length));
  });

  test("filtro de técnica fica no endereço e o link compartilhado mostra o mesmo resultado", async ({ page }) => {
    const expected = foundText(all.filter((a) => normalizeText(a.technique) === "nanquim").length);
    await page.goto("/galeria");
    const tecnica = page.getByRole("navigation", { name: "Técnica" });
    await tecnica.getByRole("link", { name: "Nanquim" }).click();
    await expect(page).toHaveURL(/\/galeria\?tecnica=nanquim$/);
    await expect(count(page)).toHaveText(expected);
    await expect(tecnica.getByRole("link", { name: "Nanquim" })).toHaveAttribute("aria-current", "true");

    // Abrir o mesmo endereço do zero (como quem recebe o link) dá o mesmo resultado.
    await page.goto("/galeria?tecnica=nanquim");
    await expect(count(page)).toHaveText(expected);
    await expect(page.getByRole("heading", { name: "[Nome da obra: croqui com chapéu]" })).toBeVisible();
  });

  test("filtros combinam: coleção + modalidade", async ({ page }) => {
    await page.goto("/galeria/croquis-de-moda?modalidade=ilustracao-digital");
    await expect(count(page)).toHaveText(
      foundText(all.filter((a) => a.category === "croquis-de-moda" && a.modality === "ilustracao-digital").length),
    );
  });

  test("busca sem acento encontra obra com acento", async ({ page }) => {
    await page.goto("/galeria");
    const search = page.getByRole("searchbox", { name: "Buscar", exact: true });
    await search.fill("chapeu");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/galeria\?q=chapeu$/);
    await expect(count(page)).toHaveText(`${foundText(all.filter((a) => matches(a, "chapeu")).length)} para “chapeu”`);
    await expect(page.getByRole("heading", { name: "[Nome da obra: croqui com chapéu]" })).toBeVisible();
  });

  test("busca do cabeçalho filtra a galeria", async ({ page }) => {
    await page.goto("/galeria?q=croqui");
    await expect(count(page)).toHaveText(new RegExp(foundText(all.filter((a) => matches(a, "croqui")).length)));
  });

  test("sem resultados: mensagem e caminho para limpar os filtros", async ({ page }) => {
    await page.goto("/galeria?q=nada-encontrado");
    await expect(page.getByText("Nenhuma obra encontrada.")).toBeVisible();
    await page.getByRole("link", { name: "Limpar filtros" }).first().click();
    await expect(page).toHaveURL(/\/galeria$/);
    await expect(count(page)).toHaveText(foundText(all.length));
  });

  test("valor inválido no endereço é ignorado", async ({ page }) => {
    await page.goto("/galeria?modalidade=%3Cscript%3E");
    await expect(count(page)).toHaveText(foundText(all.length));
  });
});

test.describe("página da obra", () => {
  test("card da galeria abre a obra com detalhes e chamada para encomendar", async ({ page }) => {
    await page.goto("/galeria?tecnica=nanquim");
    await page.getByRole("link", { name: /Ver detalhes/ }).first().click();
    await expect(page).toHaveURL(/\/obra\/croqui-chapeu$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("[Nome da obra: croqui com chapéu]");
    await expect(page.getByRole("img", { name: /Croqui a nanquim/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar uma obra inspirada nesta" })).toHaveAttribute(
      "href",
      "/encomendar?obra=croqui-chapeu",
    );
    await expect(page.getByRole("heading", { name: "Mais obras" })).toBeVisible();
  });

  test("trilha leva de volta à coleção", async ({ page }) => {
    await page.goto("/obra/croqui-chapeu");
    await page.getByRole("navigation", { name: "Você está em" }).getByRole("link", { name: "Desenho técnico de moda" }).click();
    await expect(page).toHaveURL(/\/galeria\/croquis-de-moda$/);
  });
});

test.describe("prévia de link e buscadores", () => {
  test("obra: prévia usa a foto da obra, com endereço absoluto", async ({ page }) => {
    await page.goto("/obra/croqui-chapeu");
    const ogImage = page.locator('meta[property="og:image"]').first();
    await expect(ogImage).toHaveAttribute("content", /^https?:\/\/.+\/demo\/obras\/croqui-chapeu\.jpg$/);
    await expect(page.locator('meta[property="og:title"]').first()).toHaveAttribute("content", /croqui com chapéu/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/obra\/croqui-chapeu$/);
  });

  test("home: prévia padrão é uma imagem PNG de 1200×630", async ({ page, request }) => {
    await page.goto("/");
    const content = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(content).toMatch(/\/opengraph-image/);
    const response = await request.get(new URL(content!).pathname + new URL(content!).search);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    await expect(page.locator('meta[property="og:image:width"]').first()).toHaveAttribute("content", "1200");
  });

  test("sitemap lista coleções e obras; robots bloqueia o painel", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/galeria/retratos</loc>");
    expect(sitemap).toContain("/obra/croqui-chapeu</loc>");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    expect(robots).toMatch(/Sitemap: .+\/sitemap\.xml/);
  });
});

test("coleção retirada (Kit para colorir) não tem mais página", async ({ page }) => {
  await page.goto("/galeria/kit-para-colorir");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Kit para colorir/ })).toHaveCount(0);
});
