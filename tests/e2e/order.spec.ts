import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { admin, deleteOrdersOf, ordersOf, resetRateLimits } from "./support/db";

// Envio do pedido de ponta a ponta (entrega 6), contra o Supabase de
// desenvolvimento. Cada teste usa um e-mail próprio e apaga o que criou.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

let email = "";

test.beforeEach(async () => {
  email = `e2e-${randomUUID().slice(0, 8)}@exemplo.com`;
  await resetRateLimits();
});

test.afterEach(async () => {
  await deleteOrdersOf(email);
});

const next = (page: Page) => page.getByRole("button", { name: "Continuar" }).click();

function inDays(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Ilustração digital (menos escolhas) até a revisão, com as fotos dadas. */
async function fillUntilReview(page: Page, photos: { name: string; mimeType: string; buffer: Buffer }[]) {
  await page.goto("/encomendar?modalidade=ilustracao-digital&categoria=retratos");
  await next(page);
  await page.getByRole("radio", { name: "PDF" }).check();
  await next(page);
  if (photos.length > 0) {
    await page.locator("#referencias").setInputFiles(photos);
    await expect(page.getByText(/foto(s)? adicionada/)).toBeVisible();
  }
  await page.getByLabel(/Conte um pouco/).fill("Retrato da minha mãe sorrindo, com flores ao fundo.");
  await page.getByLabel(/Quando você gostaria/).fill(inDays(30));
  await next(page);
  await page.getByLabel("Nome completo", { exact: true }).fill("Maria Teste Souza");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
  await page.getByLabel("Cidade", { exact: true }).fill("Salvador");
  await page.getByLabel("Estado", { exact: true }).selectOption("BA");
  await page.getByLabel(/Li e aceito/).check();
  await next(page);
  await expect(page.locator("#etapa-titulo")).toHaveText("Revisão");
}

test("pedido com foto: registra, guarda a foto no armazenamento privado e abre o WhatsApp", async ({ page }) => {
  await fillUntilReview(page, [{ name: "mae.png", mimeType: "image/png", buffer: PNG }]);
  await page.getByRole("button", { name: "Solicitar orçamento" }).click();

  const heading = page.getByRole("heading", { name: "Recebemos o seu pedido!" });
  await expect(heading).toBeVisible({ timeout: 20_000 });
  await expect(heading).toBeFocused();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  const number = (await page.locator("strong").filter({ hasText: /^CF-\d{4}-\d{4,}$/ }).textContent())!;

  const whatsapp = page.getByRole("link", { name: /Abrir conversa no WhatsApp/ });
  const href = (await whatsapp.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/5575988498356\?text=/);
  expect(decodeURIComponent(href)).toContain(number);
  await expect(whatsapp).toHaveAttribute("target", "_blank");

  // O que ficou gravado.
  const [order] = await ordersOf(email);
  expect(order.number).toBe(number);
  expect(order.customer_whatsapp).toBe("11912345678");
  expect(order.order_references).toEqual([{ storage_path: expect.stringMatching(/\.png$/), mime_type: "image/png" }]);
  // Sem RESEND_API_KEY no .env.local o e-mail fica como falhou (e o painel avisa).
  expect(["enviado", "falhou"]).toContain(order.email_status);
  const events = order.order_events.map((e) => e.type);
  expect(events).toContain("criado");
  // O resultado do e-mail fica registrado no histórico, qualquer que seja.
  expect(events.some((type) => type === "email_enviado" || type === "email_falhou")).toBe(true);

  // A foto existe no bucket privado e não abre pelo endereço público.
  const info = await admin.storage.from("referencias").info(order.order_references[0].storage_path);
  expect(info.data?.size).toBe(PNG.length);
  const publicUrl = admin.storage.from("referencias").getPublicUrl(order.order_references[0].storage_path).data.publicUrl;
  expect((await page.request.get(publicUrl)).status()).toBeGreaterThanOrEqual(400);

  // O rascunho foi apagado: voltar ao formulário começa do zero.
  await page.goto("/encomendar");
  await expect(page.getByRole("radio", { name: "Ilustração digital", exact: true })).not.toBeChecked();
});

test("duplo clique em enviar não duplica o pedido", async ({ page }) => {
  await fillUntilReview(page, []);
  const button = page.getByRole("button", { name: "Solicitar orçamento" });
  await button.dblclick();
  await expect(page.getByRole("heading", { name: "Recebemos o seu pedido!" })).toBeVisible({ timeout: 20_000 });
  expect(await ordersOf(email)).toHaveLength(1);
});

test("arquivo que não é imagem é recusado também pelo servidor", async ({ page }) => {
  await fillUntilReview(page, [{ name: "foto.png", mimeType: "image/png", buffer: PNG }]);
  // Troca o conteúdo no caminho até o armazenamento (o navegador já conferiu, o servidor confere de novo).
  await page.route("**/storage/v1/object/upload/sign/**", (route) =>
    route.continue({ postData: Buffer.from("isto não é uma imagem, apesar do nome") }),
  );
  await page.getByRole("button", { name: "Solicitar orçamento" }).click();
  await expect(page.locator("form [role=alert]")).toContainText('"foto.png" não é uma imagem válida', { timeout: 20_000 });
  expect(await ordersOf(email)).toHaveLength(0);
});

test("robô que preenche o campo invisível não gera pedido", async ({ page }) => {
  await fillUntilReview(page, []);
  await page.locator("#site-do-cliente").fill("https://spam.example", { force: true });
  await page.getByRole("button", { name: "Solicitar orçamento" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("Não foi possível enviar", { timeout: 20_000 });
  expect(await ordersOf(email)).toHaveLength(0);
});
