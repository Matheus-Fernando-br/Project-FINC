-- FINC 2.0 — módulos de ERP: fornecedores, compras (suprimentos), orçamentos e venda ao consumidor final (PDV)

CREATE TABLE fornecedores (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome_social         text NOT NULL,
  tipo_pessoa         text NOT NULL CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
  cpf_cnpj            text NOT NULL CHECK (cpf_cnpj ~ '^[0-9]{11}$|^[0-9]{14}$'),
  inscricao_estadual  text,
  contato             text,
  email               text,
  telefone            text,
  cep                 text,
  uf                  char(2),
  cidade              text,
  logradouro          text,
  bairro              text,
  numero              text,
  complemento         text,
  observacoes         text,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, cpf_cnpj)
);
CREATE INDEX fornecedores_usuario_nome_idx ON fornecedores (usuario_id, nome_social);

-- Pedidos de compra: ao receber, dão entrada no estoque e lançam a conta a pagar.
CREATE TABLE compras (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  numero         integer NOT NULL,
  fornecedor_id  uuid REFERENCES fornecedores (id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'recebida', 'cancelada')),
  data_compra    date NOT NULL DEFAULT CURRENT_DATE,
  previsao       date,
  recebida_em    timestamptz,
  frete          numeric(14, 2) NOT NULL DEFAULT 0 CHECK (frete >= 0),
  desconto       numeric(14, 2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  total          numeric(14, 2) NOT NULL DEFAULT 0,
  observacoes    text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, numero)
);

CREATE TABLE compra_itens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id       uuid NOT NULL REFERENCES compras (id) ON DELETE CASCADE,
  ordem           integer NOT NULL,
  produto_id      uuid REFERENCES produtos (id) ON DELETE SET NULL,
  descricao       text NOT NULL,
  quantidade      numeric(14, 3) NOT NULL CHECK (quantidade > 0),
  custo_unitario  numeric(14, 2) NOT NULL CHECK (custo_unitario >= 0),
  subtotal        numeric(14, 2) NOT NULL
);
CREATE INDEX compra_itens_compra_idx ON compra_itens (compra_id);

-- Orçamentos (propostas comerciais): aprovados viram pedido de venda.
CREATE TABLE orcamentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  numero         integer NOT NULL,
  cliente_id     uuid REFERENCES clientes (id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'aprovado', 'recusado', 'convertido')),
  data_orcamento date NOT NULL DEFAULT CURRENT_DATE,
  validade       date,
  desconto       numeric(14, 2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  total          numeric(14, 2) NOT NULL DEFAULT 0,
  condicoes      text,
  observacoes    text,
  pedido_id      uuid REFERENCES pedidos (id) ON DELETE SET NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, numero)
);

CREATE TABLE orcamento_itens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id    uuid NOT NULL REFERENCES orcamentos (id) ON DELETE CASCADE,
  ordem           integer NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('produto', 'servico')),
  produto_id      uuid REFERENCES produtos (id) ON DELETE SET NULL,
  servico_id      uuid REFERENCES servicos (id) ON DELETE SET NULL,
  descricao       text NOT NULL,
  quantidade      numeric(14, 3) NOT NULL CHECK (quantidade > 0),
  valor_unitario  numeric(14, 2) NOT NULL CHECK (valor_unitario >= 0),
  subtotal        numeric(14, 2) NOT NULL
);
CREATE INDEX orcamento_itens_orc_idx ON orcamento_itens (orcamento_id);

-- Contas a pagar podem referenciar fornecedor e compra.
ALTER TABLE contas ADD COLUMN fornecedor_id uuid REFERENCES fornecedores (id) ON DELETE SET NULL;
ALTER TABLE contas ADD COLUMN compra_id uuid REFERENCES compras (id) ON DELETE SET NULL;

-- Forma de pagamento informada na venda (PDV / NFC-e).
ALTER TABLE notas ADD COLUMN forma_pagamento text;
