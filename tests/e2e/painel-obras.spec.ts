import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { admin, createUser, deleteArtworksTitled, deleteUser, resetRateLimits, type TestUser } from "./support/db";
import { audit, login, solidPng } from "./support/panel";

// Painel de obras (entrega 8). Grava no Supabase de desenvolvimento: roda no
// projeto "painel", depois dos demais testes (ver playwright.config.ts), para
// não mudar a galeria enquanto outros testes a conferem.

const PREFIX = "Obra E2E";
const PHOTO = solidPng(40, 50);

let carla: TestUser | undefined;
let title = "";

test.beforeEach(async () => {
  await resetRateLimits();
  carla = await createUser("Carla Teste");
  title = `${PREFIX} ${randomUUID().slice(0, 6)}`;
});

test.afterEach(async () => {
  await deleteArtworksTitled(title);
  await deleteUser(carla);
});

test("cadastra obra com foto, publica na galeria e arquiva", async ({ page }) => {
  await login(page, carla!);
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: "Obras" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Obras");
  await audit(page);

  // Nova obra: começa como rascunho.
  await page.getByRole("link", { name: "Nova obra" }).click();
  await page.getByRole("button", { name: "Criar obra" }).click();
  await expect(page.getByLabel("Nome da obra")).toBeFocused();
  await expect(page.getByText("Escreva o nome da obra.")).toBeVisible();

  await page.getByLabel("Nome da obra").fill(title);
  await page.getByLabel("Coleção").selectOption({ label: "Retratos" });
  await page.getByLabel("Modalidade").selectOption({ label: "Obra feita à mão" });
  await page.getByLabel("Técnica").fill("Nanquim");
  await page.getByLabel("Descrição curta").fill("Retrato de teste feito pelo painel.");
  await page.getByRole("button", { name: "Criar obra" }).click();
  await expect(page).toHaveURL(/\/admin\/obras\/[0-9a-f-]{36}\?criada=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByText("Envie pelo menos uma foto da obra.")).toBeVisible();

  // Foto: reduzida no navegador, enviada por link assinado e conferida no servidor.
  await page.getByLabel("Adicionar fotos").setInputFiles({ name: "obra.png", mimeType: "image/png", buffer: PHOTO });
  await expect(page.getByText("1 foto adicionada.")).toBeVisible({ timeout: 20_000 });
  const photo = page.getByRole("listitem", { name: "Foto 1" });
  await expect(photo.getByText("Capa", { exact: true })).toBeVisible();
  await photo.getByLabel("Descrição da foto (texto alternativo)").fill("Retrato de teste em nanquim");
  await photo.getByLabel(/Horizontal/).fill("30");
  await photo.getByRole("button", { name: "Salvar foto 1" }).click();
  await expect(photo.getByText("Foto salva.")).toBeVisible();
  await audit(page);

  const { data: saved } = await admin
    .from("artworks")
    .select("id, slug, status, artwork_images(path, alt, focal_x, is_cover)")
    .eq("title", title)
    .single();
  expect(saved!.status).toBe("rascunho");
  expect(saved!.artwork_images).toEqual([
    { path: expect.stringMatching(new RegExp(`^obras/${saved!.id}/[a-f0-9]{16}\\.webp$`)), alt: "Retrato de teste em nanquim", focal_x: 30, is_cover: true },
  ]);

  // Rascunho não aparece no site.
  const slug = saved!.slug;
  const site = await page.context().newPage();
  await site.goto(`/obra/${slug}`);
  await expect(site.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();

  // Publicar: aparece na galeria e na página da obra, com a foto.
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Obra publicada: já aparece na galeria.")).toBeVisible();
  await site.goto("/galeria/retratos");
  await expect(site.getByRole("heading", { name: title })).toBeVisible();
  await site.goto(`/obra/${slug}`);
  await expect(site.getByRole("heading", { level: 1 })).toHaveText(title);
  const image = site.getByRole("img", { name: "Retrato de teste em nanquim" }).first();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  // Arquivar: some do site, continua no painel.
  await page.getByRole("button", { name: "Arquivar" }).click();
  await expect(page.getByText("Obra arquivada: não aparece mais no site.")).toBeVisible();
  await site.goto("/galeria/retratos");
  await expect(site.getByRole("heading", { name: title })).toHaveCount(0);
  await site.goto(`/obra/${slug}`);
  await expect(site.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();

  // Apagar de vez: some do painel e as fotos saem do bucket.
  await page.getByText("Apagar a obra de vez").click();
  await page.getByLabel('Digite "apagar" para confirmar').fill("apagar");
  await page.getByRole("button", { name: "Apagar obra" }).click();
  await expect(page).toHaveURL(/\/admin\/obras\?apagada=1$/);
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  const { data: files } = await admin.storage.from("obras").list(`obras/${saved!.id}`);
  expect(files ?? []).toEqual([]);
});

test("obra publicada não fica sem foto e endereço repetido é recusado", async ({ page }) => {
  await login(page, carla!);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/obras/nova");
  await page.getByLabel("Nome da obra").fill(title);
  await page.getByLabel("Coleção").selectOption({ label: "Casais" });
  await page.getByLabel("Modalidade").selectOption({ label: "Ilustração digital" });
  await page.getByLabel("Técnica").fill("Ilustração digital");
  await page.getByLabel("Endereço da página").fill("croqui-corset");
  await page.getByRole("button", { name: "Criar obra" }).click();
  await expect(page.getByText('Já existe uma obra com o endereço "croqui-corset". Escolha outro.')).toBeVisible();
  await expect(page.getByLabel("Endereço da página")).toBeFocused();

  await page.getByLabel("Endereço da página").fill("");
  await page.getByRole("button", { name: "Criar obra" }).click();
  await expect(page).toHaveURL(/criada=1$/);
  await page.getByLabel("Adicionar fotos").setInputFiles({ name: "obra.png", mimeType: "image/png", buffer: PHOTO });
  await expect(page.getByText("1 foto adicionada.")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Obra publicada: já aparece na galeria.")).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Apagar foto 1" }).click();
  await expect(page.getByText(/esta é a única foto/)).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Foto 1" })).toBeVisible();
});
