import { expect, test } from "@playwright/test";

// Preços, prazos e entrega informados pela Carla (entrega 5.1).

test("Tipos de obra mostra preços de referência, prazo, pagamento e entrega", async ({ page }) => {
  await page.goto("/tipos-de-obra");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tipos de obra e preços");

  const handmade = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Obra feita à mão" }) });
  await expect(handmade.getByText("A partir de R$ 90")).toBeVisible();
  for (const [label, price] of [
    ["Quadro 10 × 15 cm", "R$ 90"],
    ["Quadro 16 × 22 cm", "R$ 120"],
    ["Quadro 20 × 25 cm", "R$ 140"],
    ["Folha A4", "R$ 100"],
    ["Com moldura (porta-retrato)", "+ R$ 50"],
  ]) {
    // A linha começa pelo nome (a da moldura também cita a "Folha A4" embaixo).
    const startsWithLabel = new RegExp(`^${label.replace(/[()]/g, (char) => `\\${char}`)}`);
    const row = handmade.locator("dl > div").filter({ hasText: startsWithLabel });
    await expect(row.locator("dd")).toHaveText(price);
  }

  await expect(handmade.getByText("para Folha A4")).toBeVisible();

  const digital = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Ilustração digital", exact: true }) });
  await expect(digital.getByText("A partir de R$ 80")).toBeVisible();
  const printed = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Ilustração digital impressa" }) });
  await expect(printed.getByText("A partir de R$ 130")).toBeVisible();

  const collections = page.locator("section[aria-labelledby='colecoes-preco']");
  await expect(collections.getByRole("listitem").filter({ hasText: "Kit para colorir" })).toContainText("R$ 55");
  await expect(collections.getByRole("listitem").filter({ hasText: "Desenho técnico de moda" })).toContainText("R$ 70");

  await expect(page.getByText("Entrega em até 15 dias corridos após o pagamento inicial.")).toBeVisible();
  await expect(page.getByText(/Pix, transferência, depósito ou boleto/)).toBeVisible();
  await expect(page.getByText(/^Entrega em Feira de Santana · \+ R\$ 10$/)).toBeVisible();
  await expect(page.getByText("Envio pelos Correios")).toBeVisible();
});
