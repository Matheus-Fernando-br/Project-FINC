# Arquitetura da FINC 2.0

## Visão geral

A FINC 2.0 é um monorepo de npm workspaces dividido em três pacotes:

| Pacote | Tecnologia | Responsabilidade |
|---|---|---|
| `packages/shared` | TypeScript e Zod | Contratos de entrada (schemas), validadores (CPF, CNPJ, e-mail, senha), catálogos (UF, NCM de origem, unidades, categorias), cálculo fiscal e catálogo de erros. É usado pela API e pela web |
| `apps/api` | Node.js 22, Express 5, TypeScript, `pg` ou PGlite | Regras de negócio, autenticação, persistência, geração de PDF e XML e integrações |
| `apps/web` | React 19, Vite 7, React Router 7, Recharts e Bootstrap Icons | Interface (área pública e área logada) |

Na produção, um único processo Node serve a API (`/api/*`) e o front-end compilado (`/*`), na **mesma origem**. Assim o cookie de sessão e o CSRF funcionam sem `SameSite=None`. A FINC original falhava justamente aqui, porque usava Vercel e Render em domínios diferentes.

```
                 ┌──────────────────────────────── Servidor (Docker ou Node) ──────────────────────────────┐
 Navegador ──▶   │  Express 5                                                                              │
 (React SPA)     │   ├─ helmet (CSP, HSTS)   ├─ rate limit   ├─ cookie-parser   ├─ pino-http (log com redação) │
                 │   ├─ /api/health, /api/planos, /api/auth/*        (públicas)                             │
                 │   ├─ /api/integracoes/telegram/webhook            (segredo + chat autorizado)            │
                 │   ├─ requireAuth (sessão opaca + CSRF) ─▶ módulos de negócio                             │
                 │   │     cadastros · fornecedores · compras · orçamentos · pedidos · notas/PDV ·          │
                 │   │     financeiro · relatórios · busca · dashboard · suporte · certificado …            │
                 │   └─ estático: apps/web/dist (SPA)                                                       │
                 │                    │                                                                     │
                 │             Camada Db (interface única)                                                  │
                 │          ┌─────────┴──────────┐                                                          │
                 │      pg.Pool              PGlite (WASM)                                                  │
                 └──────────┼────────────────────┼──────────────────────────────────────────────────────────┘
                            ▼                    ▼
                     PostgreSQL 13+         diretório local (dev/testes)

 Integrações opcionais: SMTP (nodemailer) · Telegram Bot API · ViaCEP · [provedor fiscal: pendente] · [gateway de pagamento: pendente]
```

## Camadas da API

Os padrões vieram da engenharia reversa do REA (ver `engenharia-reversa/rea.md`): composition root explícito, contratos tipados, configuração validada na borda e erros tagueados.

```mermaid
flowchart TD
  S[server.ts<br/>carrega .env, trata sinais] --> B[bootstrap.ts<br/>parseConfig Zod → logger → Db → migrate]
  B --> A[app.ts composition root<br/>segurança, rotas, SPA]
  A --> M[modules/*<br/>auth, crud, cadastros, notas, pedidos,<br/>financeiro, conta, suporte, arquivos]
  M --> SV[services/*<br/>planos/limites, notificações, auditoria,<br/>documentos PDF/XML, e-mail, telegram, csv]
  M --> SH[@finc/shared<br/>schemas Zod, cálculo fiscal, erros]
  M --> DB[db/index.ts<br/>Db: query, exec, tx]
  SV --> DB
  M --> H[http/errors.ts<br/>AppError, parse, errorHandler]
```

- **Configuração** (`config.ts`): todas as variáveis de ambiente são validadas com Zod. Em produção, a aplicação recusa iniciar sem `SESSION_SECRET` ou usando PGlite. Os problemas são listados de uma vez só.
- **Contexto** (`context.ts`): `cfg`, `db`, `logger`, `mailer`, `telegram` e `fetchImpl`. Tudo é injetável, e os testes trocam e-mail, Telegram e ViaCEP por versões falsas.
- **Erros** (`http/errors.ts`): `AppError(code)` usa o catálogo compartilhado. As violações do PostgreSQL (23505, 23514, 23503, 22P02) viram erros de domínio. Mensagens internas nunca chegam ao cliente.
- **Transações**: emissão, cancelamento, importação, troca de plano e pedido→nota rodam em `db.tx`. A numeração e o estoque usam `SELECT … FOR UPDATE`.

## Fluxo de emissão de um documento

```mermaid
sequenceDiagram
  participant U as Usuário (web)
  participant A as API /notas
  participant D as PostgreSQL
  U->>A: POST /notas {tipo, cliente_id, itens, emitir:true} + X-CSRF-Token
  A->>A: requireAuth (sessão + CSRF) e validação Zod (notaSchema)
  A->>D: BEGIN
  A->>D: resolve os itens no catálogo do usuário (NFS-e só aceita serviços; NF-e/NFC-e só produtos)
  A->>A: calcularTotais (pacote shared, o mesmo da prévia na tela)
  A->>D: INSERT notas (rascunho) com snapshot do emitente e do destinatário + nota_itens
  A->>D: verifica o endereço do emitente e o limite mensal do plano
  A->>D: SELECT config_fiscal FOR UPDATE → próximo número
  A->>D: UPDATE notas status=emitida, numero=N
  A->>D: baixa de estoque (estoque_movimentos, saldo ≥ 0)
  A->>D: INSERT contas (a receber) + notificacoes + auditoria
  A->>D: COMMIT
  A-->>U: 201 nota completa
  U->>A: GET /notas/:id/pdf | /xml (gerados sob demanda a partir do snapshot)
```

## Front-end

- `api/client.ts`: wrapper de `fetch` com `credentials: include` e token CSRF em memória. Converte os erros em `ApiError` (código, mensagem e erros por campo). Também faz download e abertura autenticada de PDF e XML.
- `nav.ts`: mapa único dos módulos de ERP (Início, Cadastros, Suprimentos, Vendas, Notas fiscais, Finanças, Relatórios). Alimenta a barra superior com painéis por módulo, o submenu do módulo ativo, o menu móvel e o rótulo acima dos títulos.
- `components/AppLayout.tsx`: barra superior translúcida, busca global (Ctrl+K), notificações, menu da conta e menu lateral no celular.
- `auth/AuthContext.tsx`: sessão via `/auth/me`. `RequireAuth` protege as rotas, com `?voltar=` para retornar à página de origem após o login.
- `components/Cadastro.tsx`: formulário e lista **declarativos**, reaproveitados por clientes, produtos, serviços e contadores. Na FINC original havia clones de até 330 linhas.
- `hooks/useForm.ts`: valida com os mesmos schemas Zod da API e destaca os erros devolvidos pelo servidor.
- Identidade visual própria e minimalista: tokens CSS em `styles/global.css`, tipografia do sistema, translucidez, botões em pílula e a **bolinha verde** da marca como elemento recorrente (logo, indicador do módulo ativo, status, estados vazios). Temas claro, escuro e automático, escala de fonte, modo compacto e layout responsivo (verificado por E2E em desktop, tablet e celular).

## Estrutura de diretórios

```
finc/
├── apps/
│   ├── api/               API Express (src/, tests/ de integração)
│   └── web/               SPA React (src/pages/publico, src/pages/app, src/components)
├── packages/shared/       contratos e regras compartilhadas
├── db/migrations/         SQL versionado (001 schema, 002 pedidos, 003 planos)
├── tests/e2e/             Playwright (fluxos completos + stub do ViaCEP)
├── scripts/               install, dev, test, prod, check-secrets, licenses
├── docs/                  esta documentação
├── Dockerfile, docker-compose.yml
└── .env.example
```
