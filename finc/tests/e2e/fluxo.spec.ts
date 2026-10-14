import { expect, test, type Page } from "@playwright/test";

/** Gera um CPF válido a partir de uma semente. */
function cpf(seed: number): string {
  const base = String(200000000 + seed)
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

const erros: string[] = [];
function vigiar(page: Page) {
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/Failed to load resource/.test(m.text()) &&
      erros.push(`console: ${m.text()}`),
  );
  page.on("response", (r) => r.status() >= 500 && erros.push(`HTTP ${r.status()} ${r.url()}`));
}

test.describe.configure({ mode: "serial" });

const seed = Date.now() % 1_000_000;
const usuario = { email: `e2e${seed}@finc.test`, senha: "SenhaForte123", cpf: cpf(seed) };

test("área pública: início, planos, dúvidas e termos", async ({ page }) => {
  vigiar(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A gestão do seu negócio");
  await page.getByRole("link", { name: "Planos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "BÁSICO" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "BLACK" })).toBeVisible();
  await page.getByRole("link", { name: "Dúvidas" }).click();
  await page.getByText("As notas emitidas têm validade fiscal?").click();
  await expect(page.getByText(/sem valor fiscal/)).toBeVisible();
  await page.goto("/rota-que-nao-existe");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  expect(erros).toEqual([]);
});

test("cadastro com validação e acesso ao painel", async ({ page }) => {
  vigiar(page);
  await page.goto("/cadastro");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Verifique os campos destacados.")).toBeVisible();
  await page.getByLabel("Nome social / razão social").fill("Ateliê E2E");
  await page.getByLabel(/^CPF/).fill(usuario.cpf);
  await page.getByLabel("E-mail").fill(usuario.email);
  await page.getByLabel("Telefone").fill("31988887777");
  await page.getByLabel(/^Senha/).fill(usuario.senha);
  await page.getByLabel("Confirmar senha").fill(usuario.senha);
  await page.getByRole("checkbox", { name: /Li e aceito/ }).check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: /Olá, Ateliê/ })).toBeVisible();
  await expect(page.getByText("Primeiros passos")).toBeVisible();
  await expect(page.getByText("Sem documentos emitidos nos últimos 12 meses.")).toBeVisible();
  expect(erros).toEqual([]);
});

async function entrar(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail ou CPF/CNPJ").fill(usuario.cpf);
  await page.getByLabel("Senha").fill(usuario.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("login inválido mostra mensagem genérica; rota privada exige login", async ({ page }) => {
  await page.goto("/clientes");
  await expect(page).toHaveURL(/\/login\?voltar=%2Fclientes/);
  await page.getByLabel("E-mail ou CPF/CNPJ").fill(usuario.email);
  await page.getByLabel("Senha").fill("errada000");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Usuário ou senha inválidos.")).toBeVisible();
});

test("fluxo completo: dados, cadastros, emissão, PDF/XML, financeiro, cancelamento", async ({
  page,
}) => {
  vigiar(page);
  await entrar(page);

  // Meus dados (endereço obrigatório para emitir)
  await page.goto("/meus-dados");
  await page.getByLabel("CEP").fill("30130010");
  await page.getByLabel("CEP").blur();
  // Autopreenchimento via consulta de CEP no servidor
  await expect(page.getByLabel("Cidade")).toHaveValue("Belo Horizonte");
  await expect(page.getByLabel("UF")).toHaveValue("MG");
  await expect(page.getByLabel("Logradouro")).toHaveValue("Avenida Afonso Pena");
  await page.getByLabel("Número").fill("1000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Dados atualizados.")).toBeVisible();

  // Cliente
  await page.goto("/clientes/novo");
  await page.getByLabel("Nome social / razão social").fill("Padaria Pão Quente LTDA");
  await page.getByLabel("Tipo de pessoa").selectOption("JURIDICA");
  await page.getByLabel("CPF / CNPJ").fill("11.222.333/0001-81");
  await page.getByLabel("E-mail").fill("compras@paoquente.com");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page).toHaveURL(/\/clientes$/);
  await expect(page.getByRole("cell", { name: "Padaria Pão Quente LTDA" })).toBeVisible();

  // Produto com estoque
  await page.goto("/produtos/novo");
  await page.getByLabel(/^Nome \*/).fill("Bolo de Cenoura");
  await page.getByLabel("SKU / código").fill("BOLO-01");
  await page.getByLabel("Categoria").selectOption("Confeitaria");
  await page.getByLabel("Unidade de medida").selectOption("Unidade");
  await page.getByLabel("Preço unitário (R$)").fill("35");
  await page.getByLabel("NCM").fill("19052090");
  await page.getByLabel("CFOP").fill("5102");
  await page.getByLabel("ICMS (%)").fill("12");
  await page.getByLabel("PIS/COFINS (%)").fill("0");
  await page.getByLabel("Controlar estoque deste produto").check();
  await page.getByLabel("Estoque inicial").fill("10");
  await page.getByLabel("Estoque mínimo (alerta)").fill("2");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page).toHaveURL(/\/produtos$/);
  await expect(page.getByRole("cell", { name: /Bolo de Cenoura/ })).toBeVisible();

  // Emissão de NF-e
  await page.goto("/notas/nova");
  await page.getByLabel("Tipo de documento").selectOption("NF-e");
  await page
    .getByLabel("Cliente")
    .selectOption({ label: "Padaria Pão Quente LTDA — 11.222.333/0001-81" });
  await page
    .getByLabel("Item 1", { exact: true })
    .selectOption({ label: "Bolo de Cenoura (BOLO-01)" });
  await page.getByLabel("Qtd.", { exact: true }).fill("3");
  await expect(page.locator(".totais .total").last()).toHaveText("R$ 117,60");
  await page.getByRole("button", { name: "Emitir documento" }).click();
  await expect(page.getByRole("heading", { name: "NF-e 000000001" })).toBeVisible();
  await expect(page.getByText("Emitida", { exact: true })).toBeVisible();

  // XML e PDF
  const [xml] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar XML" }).click(),
  ]);
  expect(xml.suggestedFilename()).toBe("finc-nfe-serie1-000000001.xml");
  const [pdf] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Baixar PDF" }).click(),
  ]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);

  // Estoque baixado e conta a receber criada
  await page.goto("/estoque");
  await expect(page.getByRole("cell", { name: "7 Unidade" })).toBeVisible();
  await page.goto("/financeiro");
  await expect(page.getByRole("cell", { name: /NF-e nº 1/ })).toBeVisible();

  // Painel com dados reais
  await page.goto("/app");
  await expect(page.locator(".kpi").first()).toContainText("R$ 117,60");

  // Cancelamento
  await page.goto("/notas");
  await page.getByRole("cell", { name: "000000001" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByLabel(/Justificativa/).fill("Cliente desistiu da compra no balcão");
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(page.getByText("Documento cancelado.")).toBeVisible();
  await page.goto("/estoque");
  await expect(page.getByRole("cell", { name: "10 Unidade" })).toBeVisible();

  // Notificações
  await page.goto("/notificacoes");
  await expect(page.getByText("NF-e nº 1 cancelada")).toBeVisible();
  expect(erros).toEqual([]);
});

test("financeiro, pedido → nota, planos, suporte e configurações", async ({ page }) => {
  vigiar(page);
  await entrar(page);

  await page.goto("/financeiro");
  await page.getByRole("button", { name: "Novo lançamento" }).click();
  await page.getByLabel("Tipo").last().selectOption("pagar");
  await page.getByLabel("Valor (R$)").fill("250");
  await page.getByLabel("Descrição").fill("Conta de luz");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("cell", { name: /Conta de luz/ })).toBeVisible();
  await page
    .getByRole("row", { name: /Conta de luz/ })
    .getByRole("button", { name: "Baixar" })
    .click();
  await page.getByRole("button", { name: "Confirmar baixa" }).click();
  await expect(page.getByText("Baixa registrada.")).toBeVisible();

  await page.goto("/pedidos/novo");
  await page.getByLabel("Cliente").selectOption({ label: "Padaria Pão Quente LTDA" });
  await page
    .getByLabel("Item 1", { exact: true })
    .selectOption({ label: "Produto · Bolo de Cenoura" });
  await page.getByRole("button", { name: "Salvar pedido" }).click();
  await expect(page.getByRole("heading", { name: "Pedido nº 1" })).toBeVisible();
  await page.getByRole("button", { name: "Gerar nota" }).click();
  await expect(page.getByRole("heading", { name: "NF-e Rascunho" })).toBeVisible();

  await page.goto("/planos");
  await page.getByRole("button", { name: "Fazer upgrade" }).click();
  await expect(page.getByText("Plano alterado.")).toBeVisible();
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await expect(page.getByText("Plano BLACK")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/suporte/novo");
  await page.getByLabel("Categoria").selectOption("Notas fiscais");
  await page.getByLabel("Assunto").fill("Dúvida sobre CFOP");
  await page
    .getByLabel("Descreva sua solicitação")
    .fill("Qual CFOP usar para venda interestadual?");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Qual CFOP usar para venda interestadual?")).toBeVisible();
  await page.getByLabel("Mensagem").fill("Complementando: vendo para SP.");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Complementando: vendo para SP.")).toBeVisible();

  await page.goto("/configuracoes/fiscal");
  await page.getByLabel("Série").fill("2");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Configuração fiscal salva.")).toBeVisible();

  await page.goto("/configuracoes/aparencia");
  await page.getByLabel("Tema").selectOption("dark");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.goto("/configuracoes/integracoes");
  await expect(page.getByRole("row", { name: /E-mail \(SMTP\)/ })).toContainText("Não configurado");

  await page.goto("/configuracoes/seguranca");
  await expect(page.getByText("Esta sessão")).toBeVisible();
  const [json] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Exportar meus dados/ }).click(),
  ]);
  expect(json.suggestedFilename()).toBe("finc-meus-dados.json");

  await page.getByRole("button", { name: "Menu da conta" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(erros).toEqual([]);
});
