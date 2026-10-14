/**
 * Organização da FINC por módulos de ERP: Início, Cadastros, Suprimentos, Vendas,
 * Notas fiscais, Finanças e Relatórios. Fonte única para a barra superior,
 * o submenu do módulo, o menu móvel e o "eyebrow" dos títulos de página.
 */
export interface ItemNav {
  to: string;
  label: string;
  icon: string;
  desc: string;
}

export interface Modulo {
  id: string;
  label: string;
  base: string[];
  itens: ItemNav[];
}

export const MODULOS: Modulo[] = [
  {
    id: "inicio",
    label: "Início",
    base: ["/app"],
    itens: [
      { to: "/app", label: "Painel", icon: "bi-grid-1x2", desc: "Indicadores do seu negócio" },
    ],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    base: ["/clientes", "/fornecedores", "/produtos", "/servicos", "/contadores", "/importar"],
    itens: [
      {
        to: "/clientes",
        label: "Clientes",
        icon: "bi-people",
        desc: "Pessoas e empresas que compram de você",
      },
      {
        to: "/fornecedores",
        label: "Fornecedores",
        icon: "bi-truck",
        desc: "Quem abastece o seu negócio",
      },
      {
        to: "/produtos",
        label: "Produtos",
        icon: "bi-box-seam",
        desc: "Itens com NCM, CFOP e tributos",
      },
      { to: "/servicos", label: "Serviços", icon: "bi-tools", desc: "Serviços com CNAE e ISS" },
      {
        to: "/contadores",
        label: "Contadores",
        icon: "bi-person-badge",
        desc: "Quem recebe seus documentos",
      },
    ],
  },
  {
    id: "suprimentos",
    label: "Suprimentos",
    base: ["/estoque", "/compras"],
    itens: [
      {
        to: "/estoque",
        label: "Estoque",
        icon: "bi-boxes",
        desc: "Saldos, movimentações e mínimos",
      },
      {
        to: "/compras",
        label: "Pedidos de compra",
        icon: "bi-bag-check",
        desc: "Compras com entrada no estoque",
      },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    base: ["/pdv", "/orcamentos", "/pedidos"],
    itens: [
      {
        to: "/pdv",
        label: "Frente de caixa (PDV)",
        icon: "bi-shop",
        desc: "Venda rápida ao consumidor com NFC-e",
      },
      {
        to: "/orcamentos",
        label: "Orçamentos",
        icon: "bi-file-earmark-text",
        desc: "Propostas que viram pedido",
      },
      {
        to: "/pedidos",
        label: "Pedidos de venda",
        icon: "bi-cart3",
        desc: "Pedidos que viram nota fiscal",
      },
    ],
  },
  {
    id: "notas",
    label: "Notas fiscais",
    base: ["/notas", "/configuracoes/fiscal", "/certificado"],
    itens: [
      {
        to: "/notas/nova",
        label: "Emitir nota",
        icon: "bi-plus-circle",
        desc: "NF-e, NFC-e ou NFS-e",
      },
      {
        to: "/notas",
        label: "Notas fiscais",
        icon: "bi-receipt",
        desc: "Emitidas, rascunhos e canceladas",
      },
      {
        to: "/configuracoes/fiscal",
        label: "Configuração fiscal",
        icon: "bi-sliders",
        desc: "Série, numeração e ambiente",
      },
      {
        to: "/certificado",
        label: "Certificado digital",
        icon: "bi-shield-lock",
        desc: "Certificado A1 do emitente",
      },
    ],
  },
  {
    id: "financas",
    label: "Finanças",
    base: ["/financeiro"],
    itens: [
      {
        to: "/financeiro?tipo=receber",
        label: "Contas a receber",
        icon: "bi-arrow-down-circle",
        desc: "Recebimentos de clientes",
      },
      {
        to: "/financeiro?tipo=pagar",
        label: "Contas a pagar",
        icon: "bi-arrow-up-circle",
        desc: "Pagamentos a fornecedores",
      },
      {
        to: "/financeiro",
        label: "Todos os lançamentos",
        icon: "bi-cash-coin",
        desc: "Visão geral do financeiro",
      },
      {
        to: "/relatorios?r=fluxo",
        label: "Fluxo de caixa",
        icon: "bi-graph-up-arrow",
        desc: "Entradas e saídas por dia",
      },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    base: ["/relatorios"],
    itens: [
      {
        to: "/relatorios?r=vendas",
        label: "Vendas",
        icon: "bi-bar-chart",
        desc: "Por dia, cliente, item ou tipo",
      },
      {
        to: "/relatorios?r=dre",
        label: "DRE simplificado",
        icon: "bi-clipboard-data",
        desc: "Receitas e despesas por categoria",
      },
      {
        to: "/relatorios?r=fluxo",
        label: "Fluxo de caixa",
        icon: "bi-graph-up-arrow",
        desc: "Previsto × realizado",
      },
      {
        to: "/relatorios?r=estoque",
        label: "Posição de estoque",
        icon: "bi-boxes",
        desc: "Saldo valorizado",
      },
    ],
  },
];

export const CONTA: ItemNav[] = [
  { to: "/meus-dados", label: "Meus dados", icon: "bi-person-circle", desc: "" },
  { to: "/planos", label: "Planos", icon: "bi-stars", desc: "" },
  { to: "/notificacoes", label: "Notificações", icon: "bi-bell", desc: "" },
  { to: "/configuracoes", label: "Configurações", icon: "bi-gear", desc: "" },
  { to: "/suporte", label: "Ajuda e suporte", icon: "bi-question-circle", desc: "" },
];

export function moduloDaRota(pathname: string): Modulo | undefined {
  return MODULOS.find((m) => m.base.some((b) => pathname === b || pathname.startsWith(`${b}/`)));
}
