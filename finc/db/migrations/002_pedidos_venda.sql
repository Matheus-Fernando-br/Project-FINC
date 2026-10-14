-- Pedidos de venda (fluxo pedido -> nota inspirado em ERPs de gestão como o Bling)

CREATE TABLE pedidos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id              uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  numero                  integer NOT NULL,
  cliente_id              uuid REFERENCES clientes (id) ON DELETE SET NULL,
  status                  text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'faturado', 'cancelado')),
  data_pedido             date NOT NULL DEFAULT CURRENT_DATE,
  desconto                numeric(14, 2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  total                   numeric(14, 2) NOT NULL DEFAULT 0,
  observacoes             text,
  nota_id                 uuid REFERENCES notas (id) ON DELETE SET NULL,
  criado_em               timestamptz NOT NULL DEFAULT now(),
  atualizado_em           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, numero)
);

CREATE TABLE pedido_itens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  ordem           integer NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('produto', 'servico')),
  produto_id      uuid REFERENCES produtos (id) ON DELETE SET NULL,
  servico_id      uuid REFERENCES servicos (id) ON DELETE SET NULL,
  descricao       text NOT NULL,
  quantidade      numeric(14, 3) NOT NULL CHECK (quantidade > 0),
  valor_unitario  numeric(14, 2) NOT NULL CHECK (valor_unitario >= 0),
  subtotal        numeric(14, 2) NOT NULL
);
CREATE INDEX pedido_itens_pedido_idx ON pedido_itens (pedido_id);
