import { expect, test } from "@playwright/test";

function cpf(seed: number): string {
  const base = String(400000000 + seed)
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

const sobra = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("layout responsivo: páginas públicas e área logada sem rolagem horizontal", async ({
  page,
}) => {
  for (const rota of ["/", "/planos-finc", "/duvidas", "/login", "/cadastro"]) {
    await page.goto(rota);
    expect(await sobra(page), `rolagem horizontal em ${rota}`).toBeLessThanOrEqual(1);
  }
  const seed = (Date.now() + Math.floor(Math.random() * 1000)) % 1_000_000;
  const cadastro = await page.request.post("/api/auth/cadastro", {
    data: {
      nome: "Loja Responsiva",
      tipo_pessoa: "FISICA",
      cpf_cnpj: cpf(seed),
      email: `resp${seed}@finc.test`,
      senha: "SenhaForte123",
      telefone: "31988887777",
      aceite_termos: true,
    },
  });
  expect(cadastro.status(), "cadastro (em produção há limite de 10 cadastros/hora por IP)").toBe(
    201,
  );
  for (const rota of [
    "/app",
    "/pdv",
    "/notas/nova",
    "/notas",
    "/financeiro",
    "/relatorios",
    "/clientes",
    "/compras/nova",
    "/orcamentos/novo",
    "/configuracoes",
  ]) {
    await page.goto(rota);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(page.url(), `sessão perdida em ${rota}`).not.toContain("/login");
    expect(await sobra(page), `rolagem horizontal em ${rota}`).toBeLessThanOrEqual(1);
  }
  const vw = page.viewportSize()!.width;
  if (vw < 1100) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.locator(".sheet summary", { hasText: "Vendas" }).click();
    await page.getByRole("link", { name: /Frente de caixa/ }).click();
    await expect(page).toHaveURL(/\/pdv$/);
  } else {
    await expect(page.getByRole("navigation", { name: "Módulos" })).toBeVisible();
  }
});
