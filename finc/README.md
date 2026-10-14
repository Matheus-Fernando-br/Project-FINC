# FINC 2.0: gestão e documentos fiscais para MEIs e pequenas empresas

A FINC 2.0 é a reconstrução da plataforma FINC por engenharia reversa técnica e funcional:

- preserva os requisitos da FINC original: clientes, produtos, serviços, contadores, perfil, autenticação, planos BÁSICO e BLACK, documentos em PDF e XML, suporte e aparência;
- incorpora módulos de gestão inspirados em ERPs como o Bling: estoque, pedidos de venda, financeiro e painel com dados reais;
- adota práticas de arquitetura e qualidade observadas no REA: contratos Zod, configuração validada, erros tagueados, testes por camada, detecção de duplicação e inventário de licenças.

> Os documentos fiscais são emitidos em **ambiente de homologação, sem valor fiscal**, até que um provedor fiscal homologado seja integrado (veja [docs/integracoes.md](docs/integracoes.md)).

## Funcionalidades

A FINC é organizada como um ERP, com estes módulos no menu superior:

| Módulo | O que faz |
|---|---|
| **Início** | Painel com faturamento de 12 meses, valores a receber e a pagar, uso do plano, principais clientes e itens, estoque baixo, documentos recentes e atalhos personalizáveis |
| **Cadastros** | Clientes, fornecedores, produtos (NCM, CFOP, ICMS, PIS/COFINS, origem), serviços (CNAE, LC 116, ISS) e contadores. Todos com busca, paginação, exportação CSV e importação `.xlsx`/`.csv` com relatório linha a linha |
| **Suprimentos** | Estoque (entradas, saídas, ajustes e mínimo) e pedidos de compra. No recebimento da compra, o estoque é atualizado e a conta a pagar é lançada |
| **Vendas** | Frente de caixa (PDV) com NFC-e, troco e recebimento no ato; orçamentos (aprovação e conversão em pedido); pedidos de venda que geram a nota |
| **Notas fiscais** | NF-e, NFC-e (inclusive para consumidor final) e NFS-e: rascunho, emissão numerada, PDF, XML, cancelamento, envio ao contador, configuração fiscal e certificado A1 |
| **Finanças** | Contas a receber e a pagar, baixa, estorno, vencidos e saldo previsto |
| **Relatórios** | Vendas (por dia, cliente, item ou tipo), DRE simplificado, fluxo de caixa e posição de estoque, com gráficos, CSV e impressão |

Recursos que valem para toda a plataforma:

- busca global (**Ctrl+K**);
- notificações;
- planos **BÁSICO** e **BLACK**, com limites aplicados no servidor;
- suporte por chamados (painel da equipe e Telegram);
- LGPD (exportação e exclusão de dados);
- tema claro, escuro ou automático;
- layout responsivo para desktop, tablet e celular.

**Identidade visual:** interface minimalista, com tipografia do sistema, barra superior translúcida e cantos arredondados. A **bolinha verde** da marca aparece no logotipo, no indicador do módulo ativo, nos status e nos destaques.

**Stack:** 100% TypeScript.

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js 22, Express 5 |
| Front-end | React 19, Vite 7, React Router 7 |
| Validação | Zod |
| Banco | PostgreSQL (PGlite em desenvolvimento) |
| Testes | Vitest e Playwright |

> **Como usar cada tela:** [docs/guia-de-uso.md](docs/guia-de-uso.md). **Todas as variáveis de ambiente:** [docs/configuracao.md](docs/configuracao.md).

## Pré-requisitos (Linux)

- **Node.js 22.12 ou superior** e npm 10 ou superior. Exemplo com nvm: `nvm install 22`.
- Para produção: **PostgreSQL 13 ou superior**, ou Docker com Docker Compose.
- Opcional: credenciais SMTP, bot do Telegram e chave do cofre de certificados.

## Instalação rápida (desenvolvimento)

```bash
unzip finc-2.0.zip && cd finc
bash scripts/install.sh     # npm ci, cria .env com segredos aleatórios, compila o pacote compartilhado e migra o banco
npm run dev                 # API em http://localhost:3333 e web em http://localhost:5173
```

Em desenvolvimento, o banco padrão é o **PGlite** (PostgreSQL embarcado, gravado em `./.data/pglite`). Não é preciso instalar nenhum servidor. Abra http://localhost:5173, crie uma conta e use a plataforma.

### Instalação manual (passo a passo)

```bash
npm ci
cp .env.example .env && chmod 600 .env
# edite .env: SESSION_SECRET (openssl rand -base64 48) e, opcionalmente, CERT_ENCRYPTION_KEY (openssl rand -base64 32)
npm run build -w @finc/shared
npm run migrate
npm run dev
```

## Produção

### Opção A: Docker Compose (PostgreSQL incluído)

```bash
cp .env.example .env
# Preencha no .env: SESSION_SECRET, POSTGRES_PASSWORD, APP_URL (URL pública) e as integrações desejadas
docker compose up -d --build
# Publique atrás de um proxy HTTPS (nginx, Caddy) — em produção os cookies são Secure.
# Teste local: http://localhost:3333 funciona; em outra máquina sem HTTPS, use COOKIE_SECURE=false apenas para testes.
```

A imagem compila tudo, aplica as migrações ao iniciar, roda como usuário não-root e tem *healthcheck* em `/api/health`.

### Opção B: Node.js + PostgreSQL existente

```bash
# .env: NODE_ENV=production, DATABASE_URL=postgres://usuario:senha@host:5432/finc, SESSION_SECRET, APP_URL
bash scripts/prod.sh      # build + migrações + servidor (a API serve o front-end na mesma origem)
```

Atrás de um proxy reverso HTTPS, defina `TRUST_PROXY=true` (ou o número de saltos). Em produção, os cookies saem automaticamente como `Secure`.

### Administrador do suporte

```bash
npm run admin:promover -w @finc/api -- email@dominio.com   # libera o menu "Administração › Chamados"
# Em Docker:
docker compose exec app node apps/api/dist/scripts/promover-admin.js email@dominio.com
```

## Scripts

| Comando | Descrição |
|---|---|
| `bash scripts/install.sh` | Instalação completa |
| `npm run dev` | API (tsx watch) e web (Vite) |
| `npm test` | Testes unitários e de integração (shared, API com PGlite, web) |
| `npm run test:e2e` | Playwright. Requer `npm run build` antes |
| `npm run typecheck` / `npm run lint` / `npm run format:check` | Qualidade |
| `npm run jscpd` | Detecção de duplicação |
| `npm run build` | Build de produção |
| `npm run migrate` | Aplica as migrações |
| `bash scripts/test.sh` | Todas as verificações em sequência |
| `bash scripts/prod.sh` | Build e execução em produção |
| `npm run secrets:check` | Varredura de segredos |
| `npm run licenses` | Gera o inventário de licenças |

## Variáveis de ambiente

Todas estão comentadas em [.env.example](.env.example) e explicadas, uma a uma, em **[docs/configuracao.md](docs/configuracao.md)**. O mínimo necessário:

| Variável | Desenvolvimento | Produção |
|---|---|---|
| `DATABASE_URL` | `pglite://./.data/pglite` (padrão) | `postgres://usuario:senha@host:5432/finc` |
| `SESSION_SECRET` | Opcional | **Obrigatória** (32 caracteres ou mais: `openssl rand -base64 48`) |
| `NODE_ENV` / `SERVE_WEB` | `development` / `false` | `production` / `true` |
| `APP_URL` | `http://localhost:5173` | URL HTTPS pública |
| `CERT_ENCRYPTION_KEY` | Opcional | Necessária para usar o certificado A1 (`openssl rand -base64 32`) |
| `SMTP_*` | Opcional | Recomendada (recuperação de senha, envio ao contador) |
| `POSTGRES_PASSWORD` | — | Obrigatória no Docker Compose |

## Estrutura

```
finc/
├── apps/api        API Express 5 + TypeScript (src/modules, src/services, tests/)
├── apps/web        SPA React 19 + Vite (src/pages, src/components)
├── packages/shared Contratos Zod, validadores, cálculo fiscal e catálogo de erros
├── db/migrations   SQL versionado
├── tests/e2e       Playwright
├── scripts/        install, dev, test, prod, check-secrets, licenses
└── docs/           documentação técnica e engenharia reversa
```

## Documentação

| Documento | Assunto |
|---|---|
| [docs/guia-de-uso.md](docs/guia-de-uso.md) | **Manual do usuário:** passo a passo de cada módulo |
| [docs/configuracao.md](docs/configuracao.md) | **Todas as variáveis de ambiente**, receitas por cenário (dev, Docker, Node + systemd) e checklist de produção |
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura, camadas, diagramas e fluxo de emissão |
| [docs/api.md](docs/api.md) | Rotas REST e catálogo de erros |
| [docs/banco-de-dados.md](docs/banco-de-dados.md) | Modelo de dados (ER), tabelas, planos e backup |
| [docs/autenticacao-e-seguranca.md](docs/autenticacao-e-seguranca.md) | Autenticação, controles, vulnerabilidades corrigidas e `npm audit` |
| [docs/integracoes.md](docs/integracoes.md) | Como configurar SMTP, Telegram, certificado e CEP; pendências fiscal e de pagamento |
| [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md) | Decisões técnicas (ADRs) |
| [docs/testes.md](docs/testes.md) | Suítes e resultados reais |
| [docs/matriz-funcionalidades.md](docs/matriz-funcionalidades.md) | Matriz REA × Bling × FINC original × FINC 2.0 |
| [docs/pendencias-e-limitacoes.md](docs/pendencias-e-limitacoes.md) | O que falta e as limitações conhecidas |
| [docs/engenharia-reversa/](docs/engenharia-reversa/README.md) | Método, auditoria da original, REA e Bling |
| [docs/licencas-dependencias.md](docs/licencas-dependencias.md) | Licenças das 336 dependências de produção |

## Solução de problemas

| Sintoma | Causa provável e solução |
|---|---|
| `Configuração inválida: SESSION_SECRET é obrigatório em produção` | Defina `SESSION_SECRET` no `.env` |
| `Em produção use PostgreSQL` | Troque `DATABASE_URL` para `postgres://…` |
| Login funciona, mas toda ação dá "Falha na validação de segurança (CSRF)" | O front e a API estão em origens diferentes. Use `SERVE_WEB=true` ou um proxy na mesma origem. Domínios separados só funcionam no mesmo site (ex.: `app.seudominio.com` e `api.seudominio.com`), com `CORS_ORIGINS` e HTTPS — o cookie é `SameSite=Lax` |
| "Serviço de CEP indisponível" | O servidor não alcança `viacep.com.br`. Preencha o endereço manualmente ou ajuste `VIACEP_URL` |
| Link de redefinição de senha não chega | SMTP não configurado. Em desenvolvimento, o link aparece no log da API |
| "Armazenamento de certificados desativado" | Defina `CERT_ENCRYPTION_KEY` (32 bytes em base64) |
