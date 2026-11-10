import { expect, test } from "@playwright/test";

test("a página inicial abre em português com título da marca", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page).toHaveTitle(/Croquis e Flores/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("os tokens da marca são aplicados", async ({ page }) => {
  await page.goto("/");
  const background = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  expect(background).toBe("rgb(255, 247, 242)"); // cream #FFF7F2
});

test("não há rolagem horizontal", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
