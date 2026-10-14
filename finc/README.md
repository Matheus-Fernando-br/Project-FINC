# FINC 2.0: gestão e documentos fiscais para MEIs e pequenas empresas

A FINC 2.0 é a reconstrução da plataforma FINC por engenharia reversa técnica e funcional:

- preserva os requisitos da FINC original: clientes, produtos, serviços, contadores, perfil, autenticação, planos BÁSICO e BLACK, documentos em PDF e XML, suporte e aparência;
- incorpora módulos de gestão inspirados em ERPs como o Bling: estoque, pedidos de venda, financeiro e painel com dados reais;
- adota práticas de arquitetura e qualidade observadas no REA: contratos Zod, configuração validada, erros tagueados, testes por camada, detecção de duplicação e inventário de licenças.

> Os documentos fiscais são emitidos em **ambiente de homologação, sem valor fiscal**, até que um provedor fiscal homologado seja integrado (veja [docs/integracoes.md](docs/integracoes.md)).

## Funcionalidades

| Área | O que faz |
|---|---|
| Acesso | Cadastro de pessoa física ou jurídica (CPF/CNPJ validados); login por e-mail ou CPF/CNPJ; recuperação de senha por e-mail; troca de senha; sessões revogáveis; bloqueio após tentativas falhas |
| Cadastros | Clientes, produtos (NCM, CFOP, ICMS, PIS/COFINS, origem), serviços (CNAE, LC 116, ISS) e contadores, com busca, paginação, exportação CSV e importação `.xlsx`/`.csv` com relatório linha a linha |
| Fiscal | NF-e, NFC-e e NFS-e: rascunho, emissão com numeração sequencial, PDF e XML, cancelamento com justificativa, envio ao contador por e-mail, configuração de série, numeração, ambiente e regime |
| Estoque | Saldo, entradas, saídas e ajustes, baixa automática na emissão, estorno no cancelamento e alerta de estoque mínimo |
| Vendas | Pedidos de venda que geram o rascunho da nota fiscal |
| Financeiro | Contas a pagar e a receber, baixa, estorno, vencidas e saldo previsto. A nota emitida gera a conta a receber |
| Painel | Faturamento de 12 meses, principais clientes e itens, estoque baixo, uso do plano e atalhos personalizáveis |
| Planos | BÁSICO e BLACK, com limites aplicados no servidor, regra de downgrade e histórico de assinaturas |
| Certificado A1 | Envio do `.pfx`/`.p12`, validação de senha, titular e validade, e armazenamento cifrado (AES-256-GCM) |
| Comunicação | Notificações na plataforma e por e-mail; chamados de suporte com chat; painel da equipe; bot do Telegram; feedback |
| Privacidade | Exportação de dados, trilha de atividades e exclusão da conta (LGPD) |
| Aparência | Tema claro, escuro ou automático, tamanho da fonte, negrito, modo compacto e layout responsivo |

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

Todas estão comentadas em [.env.example](.env.example). As principais:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | `postgres://…` (produção) ou `pglite://./.data/pglite` (desenvolvimento) |
| `SESSION_SECRET` | Em produção | 32 caracteres ou mais. Assina os tokens CSRF |
| `APP_URL` | Recomendada | URL pública (links de e-mail e CORS) |
| `SERVE_WEB` | Em produção | `true` para a API servir o front-end compilado |
| `CERT_ENCRYPTION_KEY` | Opcional | Habilita o cofre de certificados A1 |
| `SMTP_*` | Opcional | Habilita e-mails |
| `TELEGRAM_*` | Opcional | Habilita o bot de suporte |

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
