import { expect, test } from "@playwright/test";

/** As splash screens respeitam prefers-reduced-motion; aqui o movimento fica ligado. */
test.use({ reducedMotion: "no-preference" });

function cpf(seed: number): string {
  const base = String(600000000 + seed)
    .slice(-9)
    .split("")
    .map(Number);
  const dv = (n: number[]) => {
    const r = (n.reduce((s, x, i) => s + x * (n.length + 1 - i), 0) * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  return [...base, d1, dv([...base, d1])].join("");
}

test("splash inicial na página inicial, uma vez por sessão, sem tela branca", async ({ page }) => {
  await page.goto("/");
  const splash = page.locator("#splash-boot");
  await expect(splash).toBeVisible();
  // Enquanto a splash está na tela, o fundo é escuro (sem flash branco).
  const fundo = await page.evaluate(
    () => getComputedStyle(document.getElementById("splash-boot")!).backgroundColor,
  );
  expect(fundo).toBe("rgb(0, 0, 0)");
  await expect(splash).toHaveCount(0, { timeout: 6_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Na mesma sessão a splash longa não se repete: sai quase de imediato.
  await page.reload();
  await expect(page.locator("#splash-boot")).toHaveCount(0, { timeout: 1_500 });
});

test("outras páginas não mostram a splash inicial", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("#splash-boot")).toHaveCount(0, { timeout: 1_500 });
});

test("splash depois do login, mas não ao restaurar a sessão", async ({ page }) => {
  const seed = (Date.now() + Math.floor(Math.random() * 1000)) % 1_000_000;
  const email = `splash${seed}@finc.test`;
  const r = await page.request.post("/api/auth/cadastro", {
    data: {
      nome: "Loja Splash",
      tipo_pessoa: "FISICA",
      cpf_cnpj: cpf(seed),
      email,
      senha: "SenhaForte123",
      telefone: "31988887777",
      aceite_termos: true,
    },
  });
  expect(r.status()).toBe(201);
  await page.request.post("/api/auth/logout", {
    headers: { "X-CSRF-Token": (await r.json()).csrfToken },
  });

  await page.goto("/login");
  await page.getByLabel("E-mail ou CPF/CNPJ").fill(email);
  await page.getByLabel("Senha").fill("SenhaForte123");
  await page.getByRole("button", { name: "Entrar" }).click();
  const splashLogin = page.locator(".splash-login");
  await expect(splashLogin).toBeVisible();
  await expect(splashLogin).toHaveCount(0, { timeout: 6_000 });
  await expect(page).toHaveURL(/\/app$/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".splash-login")).toHaveCount(0);
});
