import {
  CATEGORIAS,
  ORIGENS_PRODUTO,
  UFS,
  UNIDADES_MEDIDA,
  clienteSchema,
  contadorSchema,
  fornecedorSchema,
  produtoCreateSchema,
  servicoSchema,
} from "@finc/shared";
import { Link } from "react-router-dom";
import type { Registro } from "../../api/types";
import { CadastroForm, CadastroLista, type Campo, type Secao } from "../../components/Cadastro";
import { Badge } from "../../components/ui";
import { formatBRL, formatCpfCnpj, formatTelefone } from "../../format";

const ENDERECO: Campo[] = [
  { name: "cep", label: "CEP", col: "c3", cep: true, placeholder: "00000-000" },
  { name: "uf", label: "UF", tipo: "select", opcoes: UFS, col: "c3" },
  { name: "cidade", label: "Cidade", col: "c6" },
  { name: "logradouro", label: "Logradouro", col: "c8" },
  { name: "numero", label: "Número", col: "c4" },
  { name: "bairro", label: "Bairro", col: "c6" },
  { name: "complemento", label: "Complemento", col: "c6" },
];

const vazio = (campos: Campo[], extra: Record<string, unknown> = {}) =>
  Object.fromEntries([
    ...campos.map((c) => [c.name, c.tipo === "checkbox" ? false : ""]),
    ...Object.entries(extra),
  ]);

/* ================= Clientes ================= */

const CLIENTE_SECOES: Secao[] = [
  {
    titulo: "Identificação",
    icon: "bi-person-vcard",
    campos: [
      { name: "nome_social", label: "Nome social / razão social", required: true, col: "c8" },
      {
        name: "tipo_pessoa",
        label: "Tipo de pessoa",
        tipo: "select",
        required: true,
        col: "c4",
        opcoes: [
          { value: "FISICA", label: "Pessoa física" },
          { value: "JURIDICA", label: "Pessoa jurídica" },
        ],
      },
      { name: "cpf_cnpj", label: "CPF / CNPJ", required: true, col: "c6" },
      {
        name: "inscricao_estadual",
        label: "Inscrição estadual",
        col: "c6",
        mostrarSe: (v) => v.tipo_pessoa === "JURIDICA",
      },
    ],
  },
  {
    titulo: "Contato",
    icon: "bi-telephone",
    campos: [
      { name: "email", label: "E-mail", tipo: "email", col: "c6" },
      { name: "telefone", label: "Telefone", tipo: "tel", col: "c3" },
      { name: "whatsapp", label: "WhatsApp", tipo: "tel", col: "c3" },
    ],
  },
  { titulo: "Endereço", icon: "bi-geo-alt", campos: ENDERECO },
  {
    titulo: "Observações",
    icon: "bi-journal-text",
    campos: [{ name: "observacoes", label: "Observações internas", tipo: "textarea" }],
  },
];

export const ClientesLista = () => (
  <CadastroLista<Registro>
    titulo="Clientes"
    icon="bi-people"
    endpoint="/clientes"
    rotaBase="/clientes"
    entidadeImportacao="clientes"
    vazio="Nenhum cliente cadastrado ainda."
    colunas={[
      { titulo: "Nome", render: (r) => <strong>{String(r.nome_social)}</strong> },
      { titulo: "CPF/CNPJ", render: (r) => formatCpfCnpj(r.cpf_cnpj) },
      {
        titulo: "Contato",
        render: (r) => (r.email as string) || formatTelefone(r.telefone) || "—",
      },
      { titulo: "Cidade", render: (r) => (r.cidade ? `${r.cidade}/${r.uf ?? ""}` : "—") },
    ]}
  />
);

export const ClienteForm = () => (
  <CadastroForm
    titulo="cliente"
    icon="bi-person-plus"
    endpoint="/clientes"
    voltar="/clientes"
    secoes={CLIENTE_SECOES}
    inicial={vazio(
      CLIENTE_SECOES.flatMap((s) => s.campos),
      { tipo_pessoa: "FISICA" },
    )}
    schema={clienteSchema}
  />
);

/* ================= Produtos ================= */

const PRODUTO_SECOES: Secao[] = [
  {
    titulo: "Dados do produto",
    icon: "bi-box-seam",
    campos: [
      { name: "nome", label: "Nome", required: true, col: "c8" },
      { name: "sku", label: "SKU / código", required: true, col: "c4" },
      { name: "fabricante", label: "Fabricante", col: "c4" },
      {
        name: "categoria",
        label: "Categoria",
        tipo: "select",
        opcoes: CATEGORIAS,
        required: true,
        col: "c4",
      },
      {
        name: "unidade_medida",
        label: "Unidade de medida",
        tipo: "select",
        opcoes: UNIDADES_MEDIDA,
        required: true,
        col: "c4",
      },
      {
        name: "preco_unitario",
        label: "Preço unitário (R$)",
        tipo: "number",
        step: "0.01",
        required: true,
        col: "c4",
      },
      { name: "descricao", label: "Descrição detalhada", tipo: "textarea" },
      {
        name: "ativo",
        label: "Produto ativo (disponível para venda)",
        tipo: "checkbox",
        col: "c6",
      },
    ],
  },
  {
    titulo: "Tributação",
    icon: "bi-percent",
    campos: [
      { name: "ncm", label: "NCM", required: true, col: "c4", hint: "8 dígitos" },
      { name: "cfop", label: "CFOP", required: true, col: "c4", hint: "4 dígitos (ex.: 5102)" },
      {
        name: "origem",
        label: "Origem",
        tipo: "select",
        required: true,
        col: "c4",
        opcoes: ORIGENS_PRODUTO.map((o) => ({
          value: o.codigo,
          label: `${o.codigo} - ${o.descricao}`,
        })),
      },
      { name: "icms", label: "ICMS (%)", tipo: "number", step: "0.01", required: true, col: "c4" },
      {
        name: "pis_cofins",
        label: "PIS/COFINS (%)",
        tipo: "number",
        step: "0.01",
        required: true,
        col: "c4",
      },
    ],
  },
  {
    titulo: "Estoque",
    icon: "bi-boxes",
    campos: [
      {
        name: "controla_estoque",
        label: "Controlar estoque deste produto",
        tipo: "checkbox",
        col: "c6",
      },
      {
        name: "estoque_inicial",
        label: "Estoque inicial",
        tipo: "number",
        col: "c3",
        somenteCriacao: true,
        mostrarSe: (v) => Boolean(v.controla_estoque),
      },
      {
        name: "estoque_minimo",
        label: "Estoque mínimo (alerta)",
        tipo: "number",
        col: "c3",
        mostrarSe: (v) => Boolean(v.controla_estoque),
      },
    ],
  },
];

export const ProdutosLista = () => (
  <CadastroLista<Registro>
    titulo="Produtos"
    icon="bi-box-seam"
    endpoint="/produtos"
    rotaBase="/produtos"
    entidadeImportacao="produtos"
    vazio="Nenhum produto cadastrado ainda."
    colunas={[
      {
        titulo: "Produto",
        render: (r) => (
          <>
            <strong>{String(r.nome)}</strong>
            <div className="muted small">SKU {String(r.sku)}</div>
          </>
        ),
      },
      { titulo: "Categoria", render: (r) => String(r.categoria) },
      { titulo: "NCM / CFOP", render: (r) => `${r.ncm} / ${r.cfop}` },
      { titulo: "Preço", className: "num", render: (r) => formatBRL(r.preco_unitario) },
      {
        titulo: "Estoque",
        className: "num",
        render: (r) =>
          r.controla_estoque ? (
            <Badge
              tone={
                r.estoque_minimo !== null && Number(r.estoque_atual) <= Number(r.estoque_minimo)
                  ? "warning"
                  : undefined
              }
            >
              {String(r.estoque_atual)}
            </Badge>
          ) : (
            <span className="muted">—</span>
          ),
      },
      {
        titulo: "Status",
        render: (r) => (r.ativo ? <Badge tone="success">Ativo</Badge> : <Badge>Inativo</Badge>),
      },
    ]}
  />
);

export const ProdutoForm = () => (
  <CadastroForm
    titulo="produto"
    icon="bi-box-seam"
    endpoint="/produtos"
    voltar="/produtos"
    secoes={PRODUTO_SECOES}
    inicial={vazio(
      PRODUTO_SECOES.flatMap((s) => s.campos),
      { ativo: true, origem: "0" },
    )}
    schema={produtoCreateSchema}
    aviso={
      <p className="muted small">
        Após o cadastro, o saldo só muda por movimentações em <Link to="/estoque">Estoque</Link> ou
        pela emissão de notas.
      </p>
    }
  />
);

/* ================= Serviços ================= */

const SERVICO_SECOES: Secao[] = [
  {
    titulo: "Dados do serviço",
    icon: "bi-tools",
    campos: [
      { name: "nome", label: "Nome do serviço", required: true, col: "c8" },
      { name: "codigo_interno", label: "Código interno / SKU", col: "c4" },
      {
        name: "categoria",
        label: "Categoria",
        tipo: "select",
        opcoes: CATEGORIAS,
        required: true,
        col: "c4",
      },
      {
        name: "unidade_medida",
        label: "Unidade de medida",
        tipo: "select",
        opcoes: UNIDADES_MEDIDA,
        required: true,
        col: "c4",
      },
      {
        name: "preco",
        label: "Preço (R$)",
        tipo: "number",
        step: "0.01",
        required: true,
        col: "c4",
      },
      { name: "descricao_detalhada", label: "Descrição detalhada", tipo: "textarea" },
      { name: "ativo", label: "Serviço ativo", tipo: "checkbox", col: "c6" },
    ],
  },
  {
    titulo: "Tributação (NFS-e)",
    icon: "bi-percent",
    campos: [
      { name: "cnae", label: "CNAE", required: true, col: "c4", hint: "7 dígitos" },
      { name: "codigo_servico", label: "Código do serviço", required: true, col: "c4" },
      { name: "item_lista", label: "Item da lista (LC 116)", col: "c4" },
      { name: "aliquota_iss", label: "Alíquota ISS (%)", tipo: "number", step: "0.01", col: "c4" },
      { name: "cst_pis_cofins", label: "CST PIS/COFINS", col: "c4" },
      { name: "regime_especial", label: "Regime especial", col: "c4" },
      { name: "municipio", label: "Município de prestação", col: "c6" },
    ],
  },
];

export const ServicosLista = () => (
  <CadastroLista<Registro>
    titulo="Serviços"
    icon="bi-tools"
    endpoint="/servicos"
    rotaBase="/servicos"
    entidadeImportacao="servicos"
    vazio="Nenhum serviço cadastrado ainda."
    colunas={[
      {
        titulo: "Serviço",
        render: (r) => (
          <>
            <strong>{String(r.nome)}</strong>
            {r.codigo_interno ? (
              <div className="muted small">{String(r.codigo_interno)}</div>
            ) : null}
          </>
        ),
      },
      { titulo: "Categoria", render: (r) => String(r.categoria) },
      { titulo: "CNAE / Código", render: (r) => `${r.cnae} / ${r.codigo_servico}` },
      {
        titulo: "ISS",
        className: "num",
        render: (r) => (r.aliquota_iss === null ? "—" : `${r.aliquota_iss}%`),
      },
      { titulo: "Preço", className: "num", render: (r) => formatBRL(r.preco) },
      {
        titulo: "Status",
        render: (r) => (r.ativo ? <Badge tone="success">Ativo</Badge> : <Badge>Inativo</Badge>),
      },
    ]}
  />
);

export const ServicoForm = () => (
  <CadastroForm
    titulo="serviço"
    icon="bi-tools"
    endpoint="/servicos"
    voltar="/servicos"
    secoes={SERVICO_SECOES}
    inicial={vazio(
      SERVICO_SECOES.flatMap((s) => s.campos),
      { ativo: true },
    )}
    schema={servicoSchema}
  />
);

/* ================= Contadores ================= */

const CONTADOR_SECOES: Secao[] = [
  {
    titulo: "Dados do contador",
    icon: "bi-person-badge",
    campos: [
      { name: "nome", label: "Nome", required: true, col: "c8" },
      { name: "crc", label: "CRC", col: "c4" },
      {
        name: "email",
        label: "E-mail",
        tipo: "email",
        required: true,
        col: "c6",
        hint: "Usado para o envio de documentos.",
      },
      { name: "telefone", label: "Telefone", tipo: "tel", col: "c3" },
      { name: "cpf", label: "CPF", col: "c3" },
    ],
  },
];

export const ContadoresLista = () => (
  <CadastroLista<Registro>
    titulo="Contadores"
    icon="bi-person-badge"
    endpoint="/contadores"
    rotaBase="/contadores"
    vazio="Nenhum contador vinculado. Cadastre o seu para enviar os documentos fiscais por e-mail."
    sub="Os contadores recebem PDF e XML dos documentos que você enviar a partir da tela da nota."
    colunas={[
      { titulo: "Nome", render: (r) => <strong>{String(r.nome)}</strong> },
      { titulo: "E-mail", render: (r) => String(r.email) },
      { titulo: "CRC", render: (r) => (r.crc as string) || "—" },
      { titulo: "Telefone", render: (r) => formatTelefone(r.telefone) || "—" },
    ]}
  />
);

export const ContadorForm = () => (
  <CadastroForm
    titulo="contador"
    icon="bi-person-badge"
    endpoint="/contadores"
    voltar="/contadores"
    secoes={CONTADOR_SECOES}
    inicial={vazio(CONTADOR_SECOES[0]!.campos)}
    schema={contadorSchema}
  />
);

/* ================= Fornecedores ================= */

const FORNECEDOR_SECOES: Secao[] = [
  {
    titulo: "Identificação",
    icon: "bi-truck",
    campos: [
      { name: "nome_social", label: "Nome / razão social", required: true, col: "c8" },
      {
        name: "tipo_pessoa",
        label: "Tipo de pessoa",
        tipo: "select",
        required: true,
        col: "c4",
        opcoes: [
          { value: "JURIDICA", label: "Pessoa jurídica" },
          { value: "FISICA", label: "Pessoa física" },
        ],
      },
      { name: "cpf_cnpj", label: "CNPJ / CPF", required: true, col: "c6" },
      { name: "inscricao_estadual", label: "Inscrição estadual", col: "c6" },
    ],
  },
  {
    titulo: "Contato",
    icon: "bi-telephone",
    campos: [
      { name: "contato", label: "Pessoa de contato", col: "c4" },
      { name: "email", label: "E-mail", tipo: "email", col: "c4" },
      { name: "telefone", label: "Telefone", tipo: "tel", col: "c4" },
    ],
  },
  { titulo: "Endereço", icon: "bi-geo-alt", campos: ENDERECO },
  {
    titulo: "Observações",
    icon: "bi-journal-text",
    campos: [{ name: "observacoes", label: "Observações internas", tipo: "textarea" }],
  },
];

export const FornecedoresLista = () => (
  <CadastroLista<Registro>
    titulo="Fornecedores"
    icon="bi-truck"
    endpoint="/fornecedores"
    rotaBase="/fornecedores"
    vazio="Nenhum fornecedor cadastrado ainda."
    sub="Usados nos pedidos de compra e nas contas a pagar."
    colunas={[
      { titulo: "Fornecedor", render: (r) => <strong>{String(r.nome_social)}</strong> },
      { titulo: "CNPJ/CPF", render: (r) => formatCpfCnpj(r.cpf_cnpj) },
      { titulo: "Contato", render: (r) => (r.contato as string) || (r.email as string) || "—" },
      { titulo: "Telefone", render: (r) => formatTelefone(r.telefone) || "—" },
      { titulo: "Cidade", render: (r) => (r.cidade ? `${r.cidade}/${r.uf ?? ""}` : "—") },
    ]}
  />
);

export const FornecedorForm = () => (
  <CadastroForm
    titulo="fornecedor"
    icon="bi-truck"
    endpoint="/fornecedores"
    voltar="/fornecedores"
    secoes={FORNECEDOR_SECOES}
    inicial={vazio(
      FORNECEDOR_SECOES.flatMap((s) => s.campos),
      { tipo_pessoa: "JURIDICA" },
    )}
    schema={fornecedorSchema}
  />
);

export { ENDERECO };
