import type { Plano, LimitesPlano } from "@finc/shared";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: "usuario" | "admin";
  plano: Plano;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Registro = Record<string, unknown> & { id: string };

export interface NotaItem {
  ordem: number;
  tipo: "produto" | "servico";
  produto_id: string | null;
  servico_id: string | null;
  descricao: string;
  codigo: string | null;
  unidade: string | null;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  icms: number | null;
  pis_cofins: number | null;
  aliquota_iss: number | null;
  info: string | null;
}

export interface Parte {
  nome?: string;
  cpf_cnpj?: string;
  email?: string | null;
  telefone?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  numero?: string | null;
  complemento?: string | null;
}

export interface Nota {
  id: string;
  tipo: "NF-e" | "NFC-e" | "NFS-e";
  serie: number;
  numero: number | null;
  status: "rascunho" | "emitida" | "cancelada";
  ambiente: string;
  natureza_operacao: string | null;
  data_emissao: string | null;
  criado_em: string;
  cliente_id: string | null;
  emitente: Parte;
  destinatario: Parte;
  transporte: Record<string, unknown>;
  valor_produtos: number;
  valor_servicos: number;
  valor_icms: number;
  valor_iss: number;
  valor_pis_cofins: number;
  desconto_incondicional: number;
  desconto_condicional: number;
  valor_tributos: number;
  total: number;
  gerar_financeiro: boolean;
  vencimento: string | null;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  itens: NotaItem[];
  cliente_nome?: string;
}

export interface Assinatura {
  plano: Plano;
  uso: Record<keyof LimitesPlano, number>;
  historico: {
    id: string;
    plano_nome: string;
    valor: number;
    status: string;
    inicio: string;
    fim: string | null;
    observacao: string | null;
  }[];
  disponiveis: Plano[];
  gatewayPagamento: boolean;
}
