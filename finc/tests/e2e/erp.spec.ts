import { expect, test, type Page } from "@playwright/test";

/** Fluxos de ERP: suprimentos, vendas (orçamento, PDV), relatórios, navegação por módulos e busca. */

function cpf(seed: number): string {
  const base = String(300000000 + seed)
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

test.describe.configure({ mode: "serial" });

const erros: string[] = [];
function vigiar(page: Page) {
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 500 && erros.push(`HTTP ${r.status()} ${r.url()}`));
}

test("ERP: fornecedor, compra, orçamento → pedido, PDV, relatórios e busca", async ({ page }) => {
  vigiar(page);
  const seed = Date.now() % 1_000_000;
  // Cadastro e dados básicos via API (o foco aqui é a interface dos módulos de ERP)
  await page.goto("/");
  const r = await page.request.post("/api/auth/cadastro", {
    data: {
      nome: "Empório ERP",
      tipo_pessoa: "FISICA",
      cpf_cnpj: cpf(seed),
      email: `erp${seed}@finc.test`,
      senha: "SenhaForte123",
      telefone: "31988887777",
      aceite_termos: true,
    },
  });
  const { csrfToken } = await r.json();
  const H = { "X-CSRF-Token": csrfToken };
  await page.request.put("/api/perfil", {
    headers: H,
    data: {
      nome: "Empório ERP",
      telefone: "31988887777",
      cep: "30130010",
      uf: "MG",
      cidade: "Belo Horizonte",
      logradouro: "Rua A",
      numero: "1",
    },
  });
  await page.request.post("/api/clientes", {
    headers: H,
    data: { nome_social: "Cliente Orçamento", tipo_pessoa: "FISICA", cpf_cnpj: "52998224725" },
  });
  await page.request.post("/api/produtos", {
    headers: H,
    data: {
      nome: "Café especial 250g",
      sku: "CAFE-250",
      categoria: "Café e chás",
      unidade_medida: "Pacote",
      preco_unitario: 32,
      ncm: "09012100",
      cfop: "5102",
      icms: 12,
      pis_cofins: 0,
      origem: "0",
      controla_estoque: true,
      estoque_inicial: 1,
    },
  });

  // Navegação por módulos (menu superior) → Cadastros › Fornecedores
  await page.goto("/app");
  await page.getByRole("button", { name: "Cadastros" }).click();
  await page.getByRole("menuitem", { name: /Fornecedores/ }).click();
  await expect(page).toHaveURL(/\/fornecedores$/);
  await page.getByRole("link", { name: "Novo" }).click();
  await page.getByLabel(/^Nome \/ razão social/).fill("Torrefação Serra Verde");
  await page.getByLabel(/^CNPJ \/ CPF/).fill("45.723.174/0001-10");
  await page.getByLabel("Pessoa de contato").fill("Joana");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("cell", { name: "Torrefação Serra Verde" })).toBeVisible();

  // Suprimentos › Pedido de compra → recebimento
  await page.goto("/compras/nova");
  await page.getByLabel(/^Fornecedor/).selectOption({ label: "Torrefação Serra Verde" });
  await page
    .getByLabel("Item 1", { exact: true })
    .selectOption({ label: "Café especial 250g (CAFE-250)" });
  await page.getByLabel("Qtd.", { exact: true }).fill("20");
  await page.getByLabel("Custo unit.", { exact: true }).fill("15");
  await page.getByRole("button", { name: "Salvar compra" }).click();
  await expect(page.getByRole("heading", { name: "Compra nº 1" })).toBeVisible();
  await page.getByRole("button", { name: "Receber compra" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Recebida", { exact: true })).toBeVisible();
  await page.goto("/estoque");
  await expect(page.getByRole("cell", { name: "21 Pacote" })).toBeVisible();

  // Vendas › Orçamento → pedido de venda
  await page.goto("/orcamentos/novo");
  await page.getByLabel(/^Cliente/).selectOption({ label: "Cliente Orçamento" });
  await page
    .getByLabel("Item 1", { exact: true })
    .selectOption({ label: "Produto · Café especial 250g" });
  await page.getByLabel("Qtd.", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(page.getByRole("heading", { name: "Orçamento nº 1" })).toBeVisible();
  await page.getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByText("Aprovado", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Gerar pedido de venda" }).click();
  await expect(page.getByRole("heading", { name: "Pedido nº 1" })).toBeVisible();

  // Vendas › Frente de caixa (PDV) com troco
  await page.goto("/pdv");
  await page.getByRole("button", { name: "Adicionar Café especial 250g" }).click();
  await page.getByRole("button", { name: "Aumentar Café especial 250g" }).click();
  await expect(page.locator(".pdv-total")).toHaveText("R$ 71,68");
  await page.getByLabel("Forma de pagamento").selectOption("Dinheiro");
  await page.getByLabel("Valor recebido").fill("100");
  await expect(page.getByText("Troco: R$ 28,32")).toBeVisible();
  await page.getByRole("button", { name: "Finalizar venda" }).click();
  await expect(page.getByText(/NFC-e nº 000000001 emitida/)).toBeVisible();

  // Finanças: compra a pagar e venda do PDV já recebida
  await page.goto("/financeiro?tipo=pagar");
  await expect(page.getByRole("cell", { name: /Compra nº 1/ })).toBeVisible();
  await page.goto("/financeiro?tipo=receber");
  await expect(page.getByRole("cell", { name: /^Paga / })).toBeVisible();

  // Relatórios
  await page.goto("/relatorios?r=vendas");
  await expect(page.locator(".kpi .value").first()).toHaveText("R$ 71,68");
  await page.getByRole("tab", { name: "Estoque" }).click();
  await expect(page.getByRole("cell", { name: "Café especial 250g" })).toBeVisible();
  const [csv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar CSV" }).click(),
  ]);
  expect(csv.suggestedFilename()).toBe("posicao-estoque.csv");

  // Busca global (Ctrl+K)
  await page.keyboard.press("Control+k");
  await page.getByLabel("Buscar", { exact: true }).fill("Torref");
  await page.getByText("Torrefação Serra Verde").click();
  await expect(page).toHaveURL(/\/fornecedores\/[0-9a-f-]{36}$/);
  expect(erros).toEqual([]);
});
