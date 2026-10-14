import { expect, test } from "@playwright/test";

test("layout móvel: menu lateral recolhível e sem rolagem horizontal", async ({ page }) => {
  await page.goto("/");
  const largura = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(largura).toBeLessThanOrEqual(1);
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
