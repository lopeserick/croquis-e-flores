import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { admin, createUser, deleteUser, resetRateLimits, type TestUser } from "./support/db";
import { audit, login, saveAndWait } from "./support/helpers";

// Painel: catálogo, depoimentos, textos e configurações (entrega 9). Muda o
// conteúdo do Supabase de desenvolvimento: roda no projeto "painel", depois dos
// demais testes, e cada teste devolve o que mudou PELO PAINEL (assim o cache
// do site também volta ao normal). O afterEach só limpa o que ficou invisível.

// Em série: vários testes mudam a mesma configuração ("site").
test.describe.configure({ mode: "serial" });

let carla: TestUser | undefined;

test.beforeEach(async ({ page }) => {
  await resetRateLimits();
  carla = await createUser("Carla Teste");
  await login(page, carla);
  await expect(page).toHaveURL(/\/admin$/);
});

test.afterEach(async () => {
  await deleteUser(carla);
});

/** Bloco do painel pelo id do título (ex.: "secao-contato"). */
const section = (page: Page, titleId: string) => page.locator("section", { has: page.locator(`#${titleId}`) });

const panelNav = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name, exact: true }).click();

async function openTechniqueStep(page: Page) {
  await page.goto("/encomendar");
  await page.getByRole("radio", { name: "Obra feita à mão", exact: true }).check();
  await page.getByRole("radio", { name: "Retratos" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("radio", { name: "Folha A4" }).check();
}

test.describe("catálogo", () => {
  test.afterEach(async () => {
    // Segurança: se o teste parou no meio, a técnica volta a ficar ativa.
    await admin.from("options").update({ active: true }).eq("label", "Nanquim");
  });

  test("desativar uma técnica tira ela do configurador", async ({ page }) => {
    await panelNav(page, "Catálogo");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catálogo");
    await audit(page);
    await page.getByRole("link", { name: "Obra feita à mão" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Obra feita à mão");
    await audit(page);
    await page.getByRole("link", { name: "Nanquim", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue("Nanquim");
    await audit(page);

    await page.getByLabel("Ativa").uncheck();
    await saveAndWait(page, page.getByRole("button", { name: "Salvar opção" }));
    await expect(page.getByText("Opção salva.")).toBeVisible();

    const site = await page.context().newPage();
    await openTechniqueStep(site);
    await expect(site.getByRole("radio", { name: "Lápis de cor" })).toBeVisible();
    await expect(site.getByRole("radio", { name: "Nanquim" })).toHaveCount(0);

    // Volta a ativar pelo painel.
    await page.getByLabel("Ativa").check();
    await saveAndWait(page, page.getByRole("button", { name: "Salvar opção" }));
    await expect(page.getByText("Opção salva.")).toBeVisible();
    await openTechniqueStep(site);
    await expect(site.getByRole("radio", { name: "Nanquim" })).toBeVisible();
  });

  test("preço inválido e dependência errada são recusados", async ({ page }) => {
    await page.goto("/admin/catalogo");
    await page.getByRole("link", { name: "Obra feita à mão" }).click();
    await page.getByRole("link", { name: "Folha A4", exact: true }).click();
    await page.getByLabel("Preço (R$)").fill("cem reais");
    await saveAndWait(page, page.getByRole("button", { name: "Salvar opção" }));
    await expect(page.getByText("Valor inválido. Use o formato 90 ou 90,50.")).toBeVisible();
    await expect(page.getByLabel("Preço (R$)")).toBeFocused();
  });

  test("coleção nova aparece na página inicial; desativada, some", async ({ page }) => {
    const name = `Coleção E2E ${randomUUID().slice(0, 6)}`;
    try {
      await page.goto("/admin/catalogo");
      await page.getByRole("link", { name: "Nova coleção" }).click();
      await page.getByRole("textbox", { name: "Nome", exact: true }).fill(name);
      await page.getByLabel("Frase curta").fill("Coleção criada pelo teste");
      await saveAndWait(page, page.getByRole("button", { name: "Criar coleção" }));
      await expect(page).toHaveURL(/\/admin\/catalogo\/colecoes\/[0-9a-f-]{36}\?criada=1$/);
      await audit(page);

      const site = await page.context().newPage();
      await site.goto("/");
      await expect(site.getByRole("link", { name: new RegExp(name) })).toBeVisible();

      await page.getByLabel("Ativa").uncheck();
      await saveAndWait(page, page.getByRole("button", { name: "Salvar coleção" }));
      await expect(page.getByText("Coleção salva.")).toBeVisible();
      await site.goto("/");
      await expect(site.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
    } finally {
      await admin.from("categories").delete().like("name", "Coleção E2E%").eq("active", false);
    }
  });
});

test.describe("configurações e textos", () => {
  test("mudar o WhatsApp muda o link do site", async ({ page }) => {
    await panelNav(page, "Configurações");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Configurações");
    await audit(page);
    const whatsapp = page.getByLabel("WhatsApp");
    await expect(whatsapp).toHaveValue("(75) 98849-8356");
    const contact = section(page, "secao-contato");

    await whatsapp.fill("75 3221");
    await saveAndWait(page, contact.getByRole("button", { name: "Salvar" }));
    await expect(contact.getByText(/Número inválido/)).toBeVisible();

    await whatsapp.fill("(71) 99876-5432");
    await saveAndWait(page, contact.getByRole("button", { name: "Salvar" }));
    await expect(contact.getByText("Salvo. O site já mostra a mudança.")).toBeVisible();
    try {
      const site = await page.context().newPage();
      await site.goto("/contato");
      await expect(site.getByRole("main").getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute(
        "href",
        /^https:\/\/api\.whatsapp\.com\/send\?phone=5571998765432/,
      );
    } finally {
      await whatsapp.fill("(75) 98849-8356");
      await saveAndWait(page, contact.getByRole("button", { name: "Salvar" }));
      await expect(contact.getByText("Salvo. O site já mostra a mudança.")).toBeVisible();
    }
    const { data } = await admin.from("settings").select("value").eq("key", "site").single();
    expect((data!.value as { whatsappNumber: string }).whatsappNumber).toBe("5575988498356");
  });

  test("retenção das fotos dos clientes: prazo inválido é recusado; vazio desliga", async ({ page }) => {
    await page.goto("/admin/configuracoes");
    const retention = section(page, "secao-retencao");
    const days = retention.getByLabel(/Apagar as fotos quantos dias/);
    await expect(days).toHaveValue("");
    await days.fill("0");
    await saveAndWait(page, retention.getByRole("button", { name: "Salvar" }));
    await expect(retention.getByText("Use pelo menos 1 dia.")).toBeVisible();
    try {
      await days.fill("180");
      await saveAndWait(page, retention.getByRole("button", { name: "Salvar" }));
      const { data } = await admin.from("settings").select("value").eq("key", "retention").single();
      expect(data!.value).toEqual({ referenceDays: 180 });
    } finally {
      await days.fill("");
      await saveAndWait(page, retention.getByRole("button", { name: "Salvar" }));
    }
    const { data } = await admin.from("settings").select("value").eq("key", "retention").single();
    expect(data!.value).toEqual({ referenceDays: null });
  });

  test("textos: faixa do topo e termos de uso", async ({ page }) => {
    await panelNav(page, "Textos");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Textos do site");
    await audit(page);

    const topBar = page.getByLabel("Faixa rosa no topo do site");
    const original = await topBar.inputValue();
    const faixa = section(page, "secao-faixa");
    const terms = section(page, "secao-termos");
    const site = await page.context().newPage();
    try {
      await topBar.fill("Faixa de teste do painel");
      await saveAndWait(page, faixa.getByRole("button", { name: "Salvar" }));
      await expect(faixa.getByText("Salvo. O site já mostra a mudança.")).toBeVisible();
      await site.goto("/");
      await expect(site.getByText("Faixa de teste do painel")).toBeVisible();

      await terms.getByLabel("Texto").fill("Primeiro parágrafo dos termos.\n\nSegundo parágrafo.");
      await saveAndWait(page, terms.getByRole("button", { name: "Salvar" }));
      await expect(terms.getByText("Salvo. O site já mostra a mudança.")).toBeVisible();
      await site.goto("/termos");
      await expect(site.getByText("Segundo parágrafo.")).toBeVisible();
      await expect(site.getByText(/pendente/)).toHaveCount(0);
    } finally {
      await topBar.fill(original);
      await saveAndWait(page, faixa.getByRole("button", { name: "Salvar" }));
      await expect(faixa.getByText("Salvo. O site já mostra a mudança.")).toBeVisible();
      await terms.getByLabel("Texto").fill("");
      await saveAndWait(page, terms.getByRole("button", { name: "Salvar" }));
      await expect(terms.getByText("Salvo. O site já mostra a mudança.")).toBeVisible();
    }
    await site.goto("/termos");
    await expect(site.getByText("[Texto dos termos de uso, pendente.]")).toBeVisible();
  });

  test("como funciona: passo sem texto é recusado", async ({ page }) => {
    await page.goto("/admin/textos");
    const steps = section(page, "secao-passos");
    await steps.getByRole("button", { name: "Adicionar passo" }).click();
    await saveAndWait(page, steps.getByRole("button", { name: "Salvar" }));
    await expect(steps.getByText("Escreva o título do passo.")).toBeVisible();
  });
});

test.describe("depoimentos", () => {
  test.afterEach(async () => {
    await admin.from("testimonials").delete().like("body", "Depoimento E2E%");
  });

  test("publicar exige a autorização; publicado aparece no carrossel", async ({ page }) => {
    const body = `Depoimento E2E ${randomUUID().slice(0, 6)}: amei o retrato!`;
    await panelNav(page, "Depoimentos");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Depoimentos");
    await audit(page);
    await page.getByRole("link", { name: "Novo depoimento" }).click();
    await page.getByLabel("Depoimento", { exact: true }).fill(body);
    await page.getByLabel("Publicar no site").check();
    await saveAndWait(page, page.getByRole("button", { name: "Criar depoimento" }));
    await expect(page.getByText("Para publicar, registre como e quando o cliente autorizou.")).toBeVisible();
    await expect(page.getByLabel("Autorização do cliente")).toBeFocused();
    await audit(page);

    await page.getByLabel("Autorização do cliente").fill("Teste automático");
    await saveAndWait(page, page.getByRole("button", { name: "Criar depoimento" }));
    await expect(page).toHaveURL(/\/admin\/depoimentos\?salvo=1$/);

    const site = await page.context().newPage();
    await site.goto("/");
    const section = site.locator("section[aria-labelledby='depoimentos-titulo']");
    await expect(section.getByText(body)).toBeAttached();

    await page.getByRole("link", { name: new RegExp(body.slice(0, 20)) }).click();
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Apagar depoimento" }).click();
    await expect(page).toHaveURL(/apagado=1$/);
    await site.goto("/");
    await expect(section.getByText(body)).toHaveCount(0);
  });
});
