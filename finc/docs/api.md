# API REST da FINC 2.0

- Base: `/api` (mesma origem do front-end em produção).
- Formato: JSON em UTF-8. Uploads usam `multipart/form-data`.
- Autenticação: cookie de sessão `finc_sessao` (HttpOnly, SameSite=Lax, Secure em produção).
- CSRF: toda requisição `POST`, `PUT` ou `DELETE` autenticada precisa do header `X-CSRF-Token`. O valor vem nas respostas de `/auth/login`, `/auth/cadastro` e `/auth/me`.
- Erros seguem o formato `{ "error": { "code", "message", "details?" } }`. Os códigos estão no catálogo `packages/shared/src/erros.ts` (abaixo).
- Paginação, nas listas de cadastros e de notas: `?page=1&pageSize=20&q=busca`. A resposta traz `{ items, total, page, pageSize }`.

## Catálogo de erros

| Código | HTTP | Quando ocorre |
|---|---|---|
| `VALIDACAO` | 400 | Dados inválidos. `details` lista `[{campo, mensagem}]` |
| `NAO_AUTENTICADO` | 401 | Sem sessão, ou sessão expirada ou revogada |
| `CREDENCIAIS_INVALIDAS` | 401 | Login ou senha incorretos (mensagem genérica) |
| `CSRF` | 403 | Header `X-CSRF-Token` ausente ou inválido |
| `PROIBIDO` | 403 | Rota exclusiva de administrador, ou webhook com segredo errado |
| `NAO_ENCONTRADO` | 404 | Registro inexistente ou de outra conta |
| `CONFLITO` | 409 | Duplicidade (CPF/CNPJ, e-mail, SKU, código interno) |
| `LIMITE_PLANO` | 402 | Limite do plano atingido. `details` traz `{recurso, limite, atual}` |
| `REGRA_NEGOCIO` | 422 | Operação proibida por regra de negócio (ex.: cancelar rascunho, estoque insuficiente) |
| `MUITAS_REQUISICOES` | 429 | Rate limit excedido ou conta temporariamente bloqueada |
| `INTEGRACAO_NAO_CONFIGURADA` | 503 | SMTP, certificado ou provedor fiscal não configurado no servidor |
| `INTEGRACAO_FALHOU` | 502 | Serviço externo (SMTP, ViaCEP) falhou |
| `INTERNO` | 500 | Erro inesperado. Detalhes ficam só no log, nunca na resposta |

## Rotas públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Estado da API, do banco (`pg` ou `pglite`) e das integrações (apenas booleanos) |
| GET | `/planos` | Planos BÁSICO e BLACK, com limites e detalhes |
| POST | `/auth/cadastro` | Cria a conta no plano BÁSICO e já abre a sessão. Rate limit: 10 por hora por IP |
| POST | `/auth/login` | `{login, senha}`, em que `login` é o e-mail ou o CPF/CNPJ. Bloqueia a conta por 15 min após 5 falhas |
| POST | `/auth/esqueci-senha` | Envia o link de redefinição (válido por 1 h). A resposta é sempre a mesma, exista ou não a conta |
| POST | `/auth/redefinir-senha` | `{token, senha}`. O token é de uso único e a operação revoga todas as sessões |
| POST | `/integracoes/telegram/webhook` | Webhook do bot de suporte. Exige o header `X-Telegram-Bot-Api-Secret-Token` e o chat configurado |

## Sessão e conta (autenticadas)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/auth/me` | Usuário, plano e `csrfToken` |
| POST | `/auth/logout` | Revoga a sessão atual |
| POST | `/auth/alterar-senha` | `{senha_atual, nova_senha}`. Encerra as demais sessões |
| GET | `/auth/sessoes` | Sessões ativas (IP, navegador, último uso) |
| DELETE | `/auth/sessoes/:id` | Encerra uma sessão |
| GET, PUT | `/perfil` | Dados do emitente. CPF/CNPJ e tipo de pessoa não são editáveis |
| GET | `/assinatura` | Plano atual, uso por recurso, histórico e planos disponíveis |
| PUT | `/assinatura` | `{plano_codigo: "basico" \| "black"}`. Recusa o downgrade se o uso atual exceder os limites do novo plano |
| GET, PUT | `/config/fiscal` | Ambiente, série, próximo número, natureza da operação, CFOP padrão, regime e soma de tributos |
| GET, PUT | `/config/preferencias` | Fuso, formato de data, página inicial, modo compacto, e-mail de notificações e atalhos |
| GET | `/conta/atividade` | Trilha de auditoria (últimas 100 ações) |
| GET | `/conta/exportar` | Exportação LGPD de todos os dados (JSON) |
| POST | `/conta/excluir` | `{senha, confirmacao: "EXCLUIR"}`. Apaga a conta e tudo em cascata |
| GET | `/util/cep/:cep` | Consulta o CEP no ViaCEP pelo servidor |

## Cadastros

As rotas `/clientes`, `/produtos`, `/servicos` e `/contadores` compartilham a mesma fábrica CRUD (`modules/crud.ts`):

| Método | Rota | Descrição |
|---|---|---|
| GET | `/{entidade}` | Lista paginada com busca `q`. Em `/produtos` também aceita `?estoque_baixo=1` |
| GET | `/{entidade}/exportar.csv` | Exportação em CSV (separador `;`, com BOM e proteção contra injeção de fórmula) |
| GET | `/{entidade}/:id` | Detalhe |
| POST | `/{entidade}` | Cria. Valida pelo schema Zod compartilhado e aplica o limite do plano |
| PUT | `/{entidade}/:id` | Atualiza apenas as colunas permitidas (não há mass assignment) |
| DELETE | `/{entidade}/:id` | Exclui |

Estoque:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/estoque/movimentos?produto_id=` | Histórico (últimos 200) |
| POST | `/estoque/movimentos` | `{produto_id, tipo: entrada\|saida\|ajuste, quantidade, motivo}`. O saldo nunca fica negativo |

Importação:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/importacao/{clientes\|produtos\|servicos}/modelo.csv` | Modelo de planilha |
| POST | `/importacao/{entidade}` | Envia `.csv` ou `.xlsx` (até 5 MB e 2000 linhas). Devolve um relatório linha a linha: `{total, importados, rejeitados, erros[], colunasIgnoradas[]}` |

## Documentos fiscais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/notas` | Filtros: `status`, `tipo`, `de`, `ate`, `q` (cliente, CPF/CNPJ ou número) |
| POST | `/notas` | Cria um rascunho. Com `emitir: true`, emite na mesma transação |
| GET | `/notas/:id` | Documento com os itens |
| PUT | `/notas/:id` | Edita (só rascunhos) |
| DELETE | `/notas/:id` | Exclui (só rascunhos). Reabre o pedido de origem, se houver |
| POST | `/notas/:id/emitir` | Numeração sequencial, limite mensal, baixa de estoque, conta a receber e notificação |
| POST | `/notas/:id/cancelar` | `{motivo}` com 15 ou mais caracteres. Estorna o estoque e cancela o recebível em aberto |
| GET | `/notas/:id/pdf` | Documento auxiliar em PDF. Com `?download=1`, força o download |
| GET | `/notas/:id/xml` | XML no layout FINC (`urn:finc:documento:2.0`) |
| POST | `/notas/:id/enviar-contador` | `{contador_id}`. Envia PDF e XML por e-mail. Requer SMTP |

## Pedidos de venda

| Método | Rota | Descrição |
|---|---|---|
| GET | `/pedidos?status=` | Lista |
| POST | `/pedidos` | Cria (numeração sequencial por conta) |
| GET, PUT | `/pedidos/:id` | Detalhe ou edição (só pedidos em aberto) |
| POST | `/pedidos/:id/cancelar` | Cancela o pedido em aberto |
| POST | `/pedidos/:id/gerar-nota` | `{tipo}`. Gera o rascunho da nota e marca o pedido como faturado |

## Suprimentos e vendas (ERP)

| Método | Rota | Descrição |
|---|---|---|
| GET/POST/PUT/DELETE | `/fornecedores` | CRUD de fornecedores (mesma fábrica dos cadastros: busca, paginação, `exportar.csv`) |
| GET | `/compras?status=` | Pedidos de compra (`aberta`, `recebida`, `cancelada`) |
| POST | `/compras` | `{fornecedor_id, previsao?, itens:[{produto_id, quantidade, custo_unitario}], frete?, desconto?, observacoes?}` |
| GET / PUT | `/compras/:id` | Detalhe / edição (só abertas) |
| POST | `/compras/:id/receber` | `{gerar_conta?, vencimento?}` — entrada no estoque + conta a pagar ao fornecedor |
| POST | `/compras/:id/cancelar` | Cancela compra aberta |
| GET | `/orcamentos?status=` | Orçamentos (`aberto`, `aprovado`, `recusado`, `convertido`; campo `vencido`) |
| POST | `/orcamentos` | `{cliente_id, validade?, itens:[{produto_id\|servico_id, quantidade, valor_unitario?}], desconto?, condicoes?, observacoes?}` |
| GET / PUT | `/orcamentos/:id` | Detalhe / edição (só abertos) |
| POST | `/orcamentos/:id/{aprovar\|recusar\|reabrir}` | Muda o status |
| POST | `/orcamentos/:id/converter` | Gera pedido de venda (`{pedido_id}`) |
| POST | `/notas` com `tipo:"NFC-e"` | `cliente_id` opcional (consumidor final); `forma_pagamento` (Dinheiro, PIX, Cartão de débito/crédito, Boleto, Transferência) faz a conta a receber nascer **paga** — usado pelo PDV |

## Relatórios e busca

Todos aceitam `?formato=csv` para exportação (separador `;`, BOM UTF-8). Período máximo: 2 anos.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/vendas?de=&ate=&agrupar=dia\|cliente\|item\|tipo` | Vendas emitidas no período (`{linhas, total}`) |
| GET | `/relatorios/dre?de=&ate=` | DRE simplificado por regime de caixa (`{linhas, receitas, despesas, resultado}`) |
| GET | `/relatorios/fluxo-caixa?de=&ate=` | Por dia: entradas/saídas realizadas e previstas + saldo acumulado (`{linhas, saldo_final}`) |
| GET | `/relatorios/estoque` | Posição valorizada pelo preço de venda (`{linhas, valor_total}`) |
| GET | `/busca?q=` | Busca global (≥ 2 caracteres): clientes, produtos, serviços, fornecedores e notas |

## Financeiro e painel

| Método | Rota | Descrição |
|---|---|---|
| GET | `/financeiro/contas` | Filtros: `tipo`, `status` (inclui `vencida`), `de`, `ate` |
| POST | `/financeiro/contas` | Novo lançamento a pagar ou a receber |
| PUT | `/financeiro/contas/:id` | Edita lançamentos em aberto que não vieram de nota |
| POST | `/financeiro/contas/:id/baixar` | `{data_pagamento?, forma_pagamento?}` |
| POST | `/financeiro/contas/:id/estornar` | Volta o lançamento para "aberta" |
| DELETE | `/financeiro/contas/:id` | Exclui (nem pago nem vindo de nota) |
| GET | `/financeiro/resumo` | A receber, a pagar, vencidos, realizado no mês e saldo previsto |
| GET | `/dashboard` | Faturamento dos últimos 12 meses, principais clientes e itens, estoque baixo, uso do plano e documentos recentes |

## Notificações, suporte e certificado

| Método | Rota | Descrição |
|---|---|---|
| GET | `/notificacoes?nao_lidas=1` | Lista e contagem de não lidas |
| POST | `/notificacoes/lidas` | Marca todas como lidas |
| POST | `/notificacoes/:id/lida` | Marca uma como lida |
| DELETE | `/notificacoes/:id` | Exclui |
| GET | `/notificacoes/canais` | Canais realmente disponíveis (plataforma e e-mail/SMTP) |
| POST | `/notificacoes/canais/email/teste` | Envia um e-mail de teste |
| GET, POST | `/suporte/chamados` | Lista ou abre chamados (protocolo `AAAAMMDD` + 6 dígitos) |
| GET | `/suporte/chamados/:id` | Chamado com as mensagens. Só o dono acessa |
| POST | `/suporte/chamados/:id/mensagens` | Nova mensagem |
| POST | `/suporte/chamados/:id/encerrar` | Encerra o chamado |
| POST | `/suporte/feedback` | Feedback (fica gravado e é avisado no Telegram, se configurado) |
| GET | `/admin/chamados?status=` | Somente administradores |
| GET | `/admin/chamados/:id` | Somente administradores |
| POST | `/admin/chamados/:id/{aceitar\|responder\|fechar}` | Somente administradores |
| GET | `/admin/feedbacks` | Somente administradores |
| GET | `/certificado` | Metadados do A1 (titular, documento, validade, dias restantes) |
| POST | `/certificado` | `multipart`: `arquivo` (.pfx/.p12, até 64 KB) e `senha` |
| POST | `/certificado/validar` | Decifra e reabre o certificado armazenado |
| DELETE | `/certificado` | Remove o certificado |
