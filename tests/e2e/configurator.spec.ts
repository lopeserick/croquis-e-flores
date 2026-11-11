import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Configurador de encomenda (entrega 5): interface completa, ainda sem envio.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const heading = (page: Page) => page.locator("#etapa-titulo");
const next = (page: Page) => page.getByRole("button", { name: "Continuar" }).click();

/** Amanhã em São Paulo (AAAA-MM-DD), como o formulário calcula. */
function tomorrowInSaoPaulo(): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

test("percurso completo: da obra da galeria até a revisão", async ({ page }) => {
  await page.goto("/obra/croqui-chapeu");
  await page.getByRole("link", { name: "Criar uma obra inspirada nesta" }).click();

  // Etapa 1: já vem com a modalidade e o tema da obra escolhida.
  await expect(heading(page)).toHaveText("Sua obra");
  await expect(page.getByText("Inspirada em")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Obra feita à mão", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Croquis de moda" })).toBeChecked();
  await expect(page).toHaveURL(/\/encomendar$/); // o ?obra= sai do endereço
  await audit(page);
  await next(page);

  // Etapa 2: continuar sem escolher mostra as pendências e leva o foco a elas.
  await expect(heading(page)).toHaveText("Técnica, tamanho e entrega");
  await expect(page).toHaveURL(/etapa=2/);
  await next(page);
  const summary = page.locator("#pendencias");
  await expect(summary).toContainText("Faltam 3 informações");
  await expect(summary).toBeFocused();
  await audit(page);
  await summary.getByRole("link", { name: "Escolha a técnica." }).click();
  await expect(page.getByRole("radio", { name: "Nanquim" })).toBeFocused();

  await page.getByRole("radio", { name: "Outra técnica" }).check();
  await page.getByLabel("Qual técnica ou estilo?").fill("Carvão");
  await page.getByRole("radio", { name: "30 × 40 cm" }).check();
  await page.getByRole("radio", { name: "Com moldura" }).check();
  await expect(summary).toHaveCount(0); // pendências somem quando resolvidas
  await next(page);

  // Etapa 3: fotos (uma válida, uma falsa), descrição e data.
  await expect(heading(page)).toHaveText("Sua inspiração");
  await page.locator("#referencias").setInputFiles([
    { name: "vestido.png", mimeType: "image/png", buffer: PNG },
    { name: "falsa.jpg", mimeType: "image/jpeg", buffer: Buffer.from("isto não é imagem") },
  ]);
  await expect(page.getByText("1 foto adicionada.")).toBeVisible();
  await expect(page.getByText(/"falsa\.jpg" não é uma imagem válida/)).toBeVisible();
  await expect(page.getByRole("img", { name: /Referência 1: vestido\.png/ })).toBeVisible();
  await expect(page.getByLabel(/Quando você gostaria/)).toHaveAttribute("min", tomorrowInSaoPaulo());
  await page.getByLabel(/Conte um pouco/).fill("Croqui da minha filha com o vestido de formatura, em tons de rosa.");
  await page.getByLabel(/Quando você gostaria/).fill("2027-03-15");
  await audit(page);
  await next(page);

  // Etapa 4: dados, com máscara no WhatsApp.
  await expect(heading(page)).toHaveText("Seus dados");
  await page.getByLabel("Nome completo", { exact: true }).fill("Maria Souza");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@exemplo.com");
  await page.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
  await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveValue("(11) 91234-5678");
  await page.getByLabel("Cidade", { exact: true }).fill("Salvador");
  await page.getByLabel("Estado", { exact: true }).selectOption("BA");
  await next(page);
  await expect(page.locator("#pendencias")).toContainText("aceitar a política de privacidade");
  await page.getByLabel(/Li e aceito/).check();
  await next(page);

  // Etapa 5: revisão com tudo o que foi escolhido.
  await expect(heading(page)).toHaveText("Revisão");
  const review = page.locator("form");
  for (const text of [
    "Obra feita à mão",
    "Croquis de moda",
    "[Nome da obra: croqui com chapéu]",
    "Outra técnica: Carvão",
    "30 × 40 cm",
    "Com moldura",
    "segunda-feira, 15 de março de 2027",
    "1 foto",
    "Maria Souza",
    "(11) 91234-5678",
    "Salvador / BA",
  ]) {
    await expect(review.getByText(text, { exact: true })).toBeVisible();
  }
  await audit(page);

  // "Editar" leva à etapa e dá para voltar direto à revisão pelo indicador (desktop) ou continuando.
  await page.getByRole("button", { name: "Editar técnica, tamanho e entrega" }).click();
  await expect(heading(page)).toHaveText("Técnica, tamanho e entrega");
  await page.getByRole("radio", { name: "Sem moldura" }).check();
  await next(page);
  await next(page);
  await next(page);
  await expect(review.getByText("Sem moldura", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Solicitar orçamento" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Tudo certo" })).toBeVisible();
});

test("obra digital pede formato do arquivo, e não moldura", async ({ page }) => {
  await page.goto("/encomendar");
  await page.getByRole("radio", { name: "Ilustração digital", exact: true }).check();
  await page.getByRole("radio", { name: "Retratos" }).check();
  await next(page);
  await expect(page.getByRole("group", { name: "Formato do arquivo" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "PDF" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Moldura" })).toHaveCount(0);
});

test("trocar a modalidade mantém só o que ainda vale", async ({ page }) => {
  await page.goto("/encomendar?modalidade=obra-feita-a-mao&categoria=retratos");
  await expect(page.getByRole("radio", { name: "Retratos" })).toBeChecked();
  await page.getByRole("radio", { name: "Ilustração digital", exact: true }).check();
  await expect(page.getByRole("radio", { name: "Retratos" })).toBeChecked(); // existe nas duas
});

test("rascunho sobrevive a recarregar a página; fotos pedem nova escolha", async ({ page }) => {
  await page.goto("/encomendar?modalidade=obra-feita-a-mao&categoria=casais");
  await next(page);
  await page.getByRole("radio", { name: "Nanquim" }).check();
  await page.getByRole("radio", { name: "20 × 30 cm" }).check();
  await page.getByRole("radio", { name: "Sem moldura" }).check();
  await next(page);
  await page.locator("#referencias").setInputFiles({ name: "casal.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel(/Conte um pouco/).fill("Nós dois na praia ao entardecer.");

  await page.reload();
  await expect(heading(page)).toHaveText("Sua inspiração");
  await expect(page.getByLabel(/Conte um pouco/)).toHaveValue("Nós dois na praia ao entardecer.");
  await expect(page.getByText(/Escolha de novo: casal\.png/)).toBeVisible();

  // Recomeçar apaga tudo (com confirmação).
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Recomeçar do zero" }).click();
  await expect(heading(page)).toHaveText("Sua obra");
  await expect(page.getByRole("radio", { name: "Obra feita à mão", exact: true })).not.toBeChecked();
});

test("endereço de etapa ainda não liberada abre a primeira pendente", async ({ page }) => {
  await page.goto("/encomendar?etapa=4");
  await expect(heading(page)).toHaveText("Sua obra");
  await expect(page).toHaveURL(/\/encomendar$/);
});

test("o voltar do navegador volta uma etapa", async ({ page }) => {
  await page.goto("/encomendar?modalidade=obra-feita-a-mao&categoria=retratos");
  await next(page);
  await expect(heading(page)).toHaveText("Técnica, tamanho e entrega");
  await page.goBack();
  await expect(heading(page)).toHaveText("Sua obra");
  await expect(page).toHaveURL(/\/encomendar$/);
});

test("ao trocar de etapa, o foco vai para o título (leitor de tela anuncia)", async ({ page }) => {
  await page.goto("/encomendar?modalidade=obra-feita-a-mao&categoria=retratos");
  await next(page);
  await expect(heading(page)).toBeFocused();
});

test("Tipos de obra → Encomendar já escolhe a modalidade", async ({ page }) => {
  await page.goto("/tipos-de-obra");
  await page.getByRole("link", { name: "Encomendar" }).nth(1).click();
  await expect(page.getByRole("radio", { name: "Ilustração digital", exact: true })).toBeChecked();
});
