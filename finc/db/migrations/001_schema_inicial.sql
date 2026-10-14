-- FINC 2.0 — schema inicial (PostgreSQL >= 13)
-- Todas as tabelas de negócio são isoladas por usuario_id (multi-tenant por conta).

CREATE TABLE planos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo             text NOT NULL UNIQUE CHECK (codigo IN ('basico', 'black')),
  nome               text NOT NULL,
  valor              numeric(10, 2) NOT NULL CHECK (valor >= 0),
  limite_clientes    integer CHECK (limite_clientes IS NULL OR limite_clientes >= 0),
  limite_produtos    integer CHECK (limite_produtos IS NULL OR limite_produtos >= 0),
  limite_servicos    integer CHECK (limite_servicos IS NULL OR limite_servicos >= 0),
  limite_contadores  integer CHECK (limite_contadores IS NULL OR limite_contadores >= 0),
  limite_notas_mes   integer CHECK (limite_notas_mes IS NULL OR limite_notas_mes >= 0),
  detalhes           jsonb NOT NULL DEFAULT '[]'::jsonb,
  ordem              integer NOT NULL DEFAULT 0,
  criado_em          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text NOT NULL UNIQUE CHECK (email = lower(email)),
  senha_hash           text NOT NULL,
  nome                 text NOT NULL,
  tipo_pessoa          text NOT NULL CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
  cpf_cnpj             text NOT NULL UNIQUE CHECK (cpf_cnpj ~ '^[0-9]{11}$|^[0-9]{14}$'),
  telefone             text,
  inscricao_estadual   text,
  inscricao_municipal  text,
  cep                  text,
  uf                   char(2),
  cidade               text,
  logradouro           text,
  bairro               text,
  numero               text,
  complemento          text,
  plano_id             uuid NOT NULL REFERENCES planos (id),
  papel                text NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario', 'admin')),
  falhas_login         integer NOT NULL DEFAULT 0,
  bloqueado_ate        timestamptz,
  ultimo_login_em      timestamptz,
  criado_em            timestamptz NOT NULL DEFAULT now(),
  atualizado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessoes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  token_hash     text NOT NULL UNIQUE,
  ip             text,
  user_agent     text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  ultimo_uso_em  timestamptz NOT NULL DEFAULT now(),
  expira_em      timestamptz NOT NULL,
  revogada_em    timestamptz
);
CREATE INDEX sessoes_usuario_idx ON sessoes (usuario_id);

CREATE TABLE tokens_redefinicao (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expira_em   timestamptz NOT NULL,
  usado_em    timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assinaturas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  plano_id    uuid NOT NULL REFERENCES planos (id),
  valor       numeric(10, 2) NOT NULL,
  status      text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada')),
  inicio      timestamptz NOT NULL DEFAULT now(),
  fim         timestamptz,
  observacao  text
);
CREATE INDEX assinaturas_usuario_idx ON assinaturas (usuario_id, inicio DESC);

CREATE TABLE clientes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome_social         text NOT NULL,
  tipo_pessoa         text NOT NULL CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
  cpf_cnpj            text NOT NULL CHECK (cpf_cnpj ~ '^[0-9]{11}$|^[0-9]{14}$'),
  inscricao_estadual  text,
  email               text,
  telefone            text,
  whatsapp            text,
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
CREATE INDEX clientes_usuario_nome_idx ON clientes (usuario_id, nome_social);

CREATE TABLE produtos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome              text NOT NULL,
  fabricante        text,
  categoria         text NOT NULL,
  descricao         text,
  sku               text NOT NULL,
  unidade_medida    text NOT NULL,
  preco_unitario    numeric(14, 2) NOT NULL CHECK (preco_unitario >= 0),
  ncm               text NOT NULL CHECK (ncm ~ '^[0-9]{8}$'),
  cfop              text NOT NULL CHECK (cfop ~ '^[0-9]{4}$'),
  icms              numeric(5, 2) NOT NULL DEFAULT 0 CHECK (icms BETWEEN 0 AND 100),
  pis_cofins        numeric(5, 2) NOT NULL DEFAULT 0 CHECK (pis_cofins BETWEEN 0 AND 100),
  origem            text NOT NULL CHECK (origem ~ '^[0-8]$'),
  controla_estoque  boolean NOT NULL DEFAULT false,
  estoque_atual     numeric(14, 3) NOT NULL DEFAULT 0,
  estoque_minimo    numeric(14, 3),
  ativo             boolean NOT NULL DEFAULT true,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  atualizado_em     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, sku)
);
CREATE INDEX produtos_usuario_nome_idx ON produtos (usuario_id, nome);

CREATE TABLE servicos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id           uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome                 text NOT NULL,
  categoria            text NOT NULL,
  codigo_interno       text,
  descricao_detalhada  text,
  preco                numeric(14, 2) NOT NULL CHECK (preco >= 0),
  unidade_medida       text NOT NULL,
  cnae                 text NOT NULL CHECK (cnae ~ '^[0-9]{7}$'),
  codigo_servico       text NOT NULL,
  item_lista           text,
  aliquota_iss         numeric(5, 2) CHECK (aliquota_iss IS NULL OR aliquota_iss BETWEEN 0 AND 100),
  cst_pis_cofins       text,
  regime_especial      text,
  municipio            text,
  ativo                boolean NOT NULL DEFAULT true,
  criado_em            timestamptz NOT NULL DEFAULT now(),
  atualizado_em        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX servicos_codigo_interno_uk ON servicos (usuario_id, codigo_interno) WHERE codigo_interno IS NOT NULL;
CREATE INDEX servicos_usuario_nome_idx ON servicos (usuario_id, nome);

CREATE TABLE contadores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome           text NOT NULL,
  email          text NOT NULL,
  cpf            text,
  crc            text,
  telefone       text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, email)
);

CREATE TABLE config_fiscal (
  usuario_id            uuid PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
  ambiente              text NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
  tipo_emissao          text NOT NULL DEFAULT 'normal' CHECK (tipo_emissao IN ('normal', 'contingencia')),
  natureza_operacao     text DEFAULT 'Venda de mercadoria',
  cfop_padrao           text,
  serie                 integer NOT NULL DEFAULT 1 CHECK (serie BETWEEN 1 AND 999),
  proximo_numero        integer NOT NULL DEFAULT 1 CHECK (proximo_numero >= 1),
  numeracao_automatica  boolean NOT NULL DEFAULT true,
  regime_tributario     text NOT NULL DEFAULT 'mei' CHECK (regime_tributario IN ('mei', 'simples', 'presumido', 'real')),
  somar_impostos        boolean NOT NULL DEFAULT true,
  atualizado_em         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE preferencias (
  usuario_id     uuid PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
  dados          jsonb NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notas (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id              uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  cliente_id              uuid REFERENCES clientes (id) ON DELETE SET NULL,
  tipo                    text NOT NULL CHECK (tipo IN ('NF-e', 'NFC-e', 'NFS-e')),
  serie                   integer NOT NULL,
  numero                  integer,
  status                  text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'emitida', 'cancelada')),
  ambiente                text NOT NULL,
  natureza_operacao       text,
  data_emissao            timestamptz,
  emitente                jsonb NOT NULL,
  destinatario            jsonb NOT NULL,
  transporte              jsonb NOT NULL DEFAULT '{}'::jsonb,
  valor_produtos          numeric(14, 2) NOT NULL DEFAULT 0,
  valor_servicos          numeric(14, 2) NOT NULL DEFAULT 0,
  base_icms               numeric(14, 2) NOT NULL DEFAULT 0,
  valor_icms              numeric(14, 2) NOT NULL DEFAULT 0,
  base_iss                numeric(14, 2) NOT NULL DEFAULT 0,
  valor_iss               numeric(14, 2) NOT NULL DEFAULT 0,
  valor_pis_cofins        numeric(14, 2) NOT NULL DEFAULT 0,
  desconto_incondicional  numeric(14, 2) NOT NULL DEFAULT 0,
  desconto_condicional    numeric(14, 2) NOT NULL DEFAULT 0,
  valor_tributos          numeric(14, 2) NOT NULL DEFAULT 0,
  total                   numeric(14, 2) NOT NULL DEFAULT 0,
  somar_impostos          boolean NOT NULL DEFAULT true,
  gerar_financeiro        boolean NOT NULL DEFAULT true,
  vencimento              date,
  observacoes             text,
  motivo_cancelamento     text,
  cancelada_em            timestamptz,
  criado_em               timestamptz NOT NULL DEFAULT now(),
  atualizado_em           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notas_numeracao_uk ON notas (usuario_id, serie, numero) WHERE numero IS NOT NULL;
CREATE INDEX notas_usuario_emissao_idx ON notas (usuario_id, data_emissao DESC);

CREATE TABLE nota_itens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id         uuid NOT NULL REFERENCES notas (id) ON DELETE CASCADE,
  ordem           integer NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('produto', 'servico')),
  produto_id      uuid REFERENCES produtos (id) ON DELETE SET NULL,
  servico_id      uuid REFERENCES servicos (id) ON DELETE SET NULL,
  descricao       text NOT NULL,
  codigo          text,
  categoria       text,
  unidade         text,
  ncm             text,
  cfop            text,
  codigo_servico  text,
  quantidade      numeric(14, 3) NOT NULL CHECK (quantidade > 0),
  valor_unitario  numeric(14, 2) NOT NULL CHECK (valor_unitario >= 0),
  subtotal        numeric(14, 2) NOT NULL,
  icms            numeric(5, 2),
  pis_cofins      numeric(5, 2),
  aliquota_iss    numeric(5, 2),
  info            text
);
CREATE INDEX nota_itens_nota_idx ON nota_itens (nota_id);

CREATE TABLE estoque_movimentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  produto_id  uuid NOT NULL REFERENCES produtos (id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade  numeric(14, 3) NOT NULL,
  saldo_apos  numeric(14, 3) NOT NULL,
  motivo      text,
  nota_id     uuid REFERENCES notas (id) ON DELETE SET NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX estoque_mov_produto_idx ON estoque_movimentos (produto_id, criado_em DESC);

CREATE TABLE contas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  tipo             text NOT NULL CHECK (tipo IN ('receber', 'pagar')),
  descricao        text NOT NULL,
  valor            numeric(14, 2) NOT NULL CHECK (valor > 0),
  vencimento       date NOT NULL,
  status           text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'paga', 'cancelada')),
  data_pagamento   date,
  forma_pagamento  text,
  categoria        text,
  cliente_id       uuid REFERENCES clientes (id) ON DELETE SET NULL,
  nota_id          uuid REFERENCES notas (id) ON DELETE SET NULL,
  observacoes      text,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contas_usuario_venc_idx ON contas (usuario_id, vencimento);

CREATE TABLE notificacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  tipo        text NOT NULL,
  titulo      text NOT NULL,
  mensagem    text NOT NULL,
  link        text,
  lida_em     timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notificacoes_usuario_idx ON notificacoes (usuario_id, criado_em DESC);

CREATE TABLE chamados (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  protocolo      text NOT NULL UNIQUE,
  categoria      text NOT NULL,
  assunto        text NOT NULL,
  status         text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'aceito', 'fechado')),
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chamados_usuario_idx ON chamados (usuario_id, criado_em DESC);

CREATE TABLE chamado_mensagens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id  uuid NOT NULL REFERENCES chamados (id) ON DELETE CASCADE,
  autor       text NOT NULL CHECK (autor IN ('cliente', 'suporte')),
  mensagem    text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chamado_mensagens_idx ON chamado_mensagens (chamado_id, criado_em);

CREATE TABLE feedbacks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  mensagem    text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE certificados (
  usuario_id       uuid PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
  nome_arquivo     text NOT NULL,
  titular          text,
  documento        text,
  emissor          text,
  numero_serie     text,
  valido_de        timestamptz NOT NULL,
  valido_ate       timestamptz NOT NULL,
  arquivo_cifrado  text NOT NULL,
  senha_cifrada    text NOT NULL,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auditoria (
  id           bigserial PRIMARY KEY,
  usuario_id   uuid REFERENCES usuarios (id) ON DELETE CASCADE,
  acao         text NOT NULL,
  entidade     text,
  entidade_id  text,
  ip           text,
  detalhes     jsonb,
  criado_em    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auditoria_usuario_idx ON auditoria (usuario_id, criado_em DESC);
