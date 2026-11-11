import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Configurador de encomenda (entrega 5): interface completa, ainda sem envio.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const heading = (page: Page) => page.locator("#etapa-titulo");
const next = (page: Page) => page.getByRole("button", { name: "Continuar" }).click();

/** Hoje + N dias em São Paulo (AAAA-MM-DD), como o formulário calcula. */
function daysFromTodayInSaoPaulo(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
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
  await expect(page.getByRole("radio", { name: "Desenho técnico de moda" })).toBeChecked();
  await expect(page.getByText("A partir de R$ 90")).toBeVisible(); // menor tamanho da obra feita à mão
  await expect(page).toHaveURL(/\/encomendar$/); // o ?obra= sai do endereço
  await audit(page);
  await next(page);

  // Etapa 2: continuar sem escolher mostra as pendências e leva o foco a elas.
  await expect(heading(page)).toHaveText("Técnica, tamanho e entrega");
  await expect(page).toHaveURL(/etapa=2/);
  // Técnica e moldura dependem do tamanho: só aparecem depois dele.
  await expect(page.getByRole("group", { name: "Técnica" })).toHaveCount(0);
  await next(page);
  const summary = page.locator("#pendencias");
  await expect(summary).toContainText("Faltam 2 informações");
  await expect(summary).toBeFocused();
  await audit(page);
  await summary.getByRole("link", { name: "Escolha o tamanho." }).click();
  await expect(page.getByRole("radio", { name: "Quadro 10 × 15 cm" })).toBeFocused();

  await page.getByRole("radio", { name: "Folha A4" }).check();
  await expect(summary).toContainText("Escolha a técnica."); // a folha pede técnica e moldura
  await page.getByRole("radio", { name: "Nanquim" }).check();
  await page.getByRole("radio", { name: "Com moldura (porta-retrato)" }).check();
  await page.getByRole("radio", { name: "Entrega em Feira de Santana" }).check();
  await expect(summary).toHaveCount(0); // pendências somem quando resolvidas
  await audit(page);
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
  await expect(page.getByLabel(/Quando você gostaria/)).toHaveAttribute("min", daysFromTodayInSaoPaulo(15));
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
    "Desenho técnico de moda",
    "[Nome da obra: croqui com chapéu]",
    "Folha A4 (R$ 100)",
    "Nanquim",
    "Com moldura (porta-retrato) (+ R$ 50)",
    "Entrega em Feira de Santana (+ R$ 10)",
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
  // Trocar a folha por um quadro: a técnica vira acrílica sozinha e a moldura sai.
  await page.getByRole("radio", { name: "Quadro 20 × 25 cm" }).check();
  await expect(page.getByRole("radio", { name: "Tinta acrílica" })).toBeChecked();
  await expect(page.getByRole("group", { name: "Moldura" })).toHaveCount(0);
  await next(page);
  await next(page);
  await next(page);
  await expect(review.getByText("Quadro 20 × 25 cm (R$ 140)", { exact: true })).toBeVisible();
  await expect(review.getByText("Tinta acrílica", { exact: true })).toBeVisible();
  await expect(review.getByText("Com moldura (porta-retrato) (+ R$ 50)")).toHaveCount(0);

  await page.getByRole("button", { name: "Solicitar orçamento" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Tudo certo" })).toBeVisible();
});

test("obra digital pede formato do arquivo (PDF ou JPG), e não moldura nem entrega", async ({ page }) => {
  await page.goto("/encomendar");
  await page.getByRole("radio", { name: "Ilustração digital", exact: true }).check();
  await page.getByRole("radio", { name: "Retratos" }).check();
  await next(page);
  // Tamanho e técnica únicos já vêm escolhidos.
  await expect(page.getByRole("radio", { name: "A4" })).toBeChecked();
  await expect(page.getByRole("group", { name: "Formato do arquivo" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "PDF" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "JPG" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Moldura" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Como você quer receber?" })).toHaveCount(0);
});

test("Kit para colorir só aparece nas ilustrações", async ({ page }) => {
  await page.goto("/encomendar?modalidade=obra-feita-a-mao");
  await expect(page.getByRole("radio", { name: "Pets" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Kit para colorir" })).toHaveCount(0);
  await page.getByRole("radio", { name: "Ilustração digital", exact: true }).check();
  await expect(page.getByRole("radio", { name: "Kit para colorir" })).toBeVisible();
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
  await page.getByRole("radio", { name: "Folha A4" }).check();
  await page.getByRole("radio", { name: "Nanquim" }).check();
  await page.getByRole("radio", { name: "Sem moldura" }).check();
  await page.getByRole("radio", { name: "Retirada em Feira de Santana" }).check();
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
  await page.getByRole("link", { name: "Encomendar Ilustração digital", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Ilustração digital", exact: true })).toBeChecked();
});
