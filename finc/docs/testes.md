# Testes e verificações

Todos os resultados abaixo vieram de execuções reais em 14/10/2026, em Linux com Node 22.22.0 e npm 10.9.4.

## Suítes automatizadas

| Suíte | Ferramenta | Arquivos | Testes | O que cobre |
|---|---|---|---|---|
| `packages/shared` | Vitest 5 | `src/shared.test.ts` | 13 | CPF, CNPJ, senha e formatação; cálculo fiscal (soma de tributos, sem soma, nunca negativo, tipo de item por nota); schemas (normalização, legado PFisica/PJuridica, NCM, CFOP e alíquotas); limites de plano |
| `apps/api` | Vitest 5 + supertest | `tests/auth`, `cadastros`, `notas`, `outros` | 47 | HTTP de ponta a ponta com banco real: cadastro e login (e-mail ou CPF), bloqueio, CSRF, logout, redefinição e troca de senha, sessões; CRUD, busca, paginação, CSV, isolamento entre contas e mass assignment; estoque; importação com relatório e limite; limites de plano e downgrade; emissão (numeração, estoque, financeiro, notificação), PDF, XML (escape), cancelamento, limite mensal, ambiente de produção bloqueado, envio ao contador; pedidos → nota; financeiro e painel; certificado A1 (senha, titular, validade, cifragem); suporte (dono, admin, webhook com segredo e chat); preferências, CEP e LGPD |
| `apps/web` | Vitest 5 + Testing Library + jsdom | `src/web.test.tsx` | 5 | Associação automática de rótulos; formatação de datas e preferências; cliente HTTP (CSRF, credenciais, erros por campo); redirecionamento de rota protegida; mensagem de login |
| E2E | Playwright 1.56 (Chromium) | `tests/e2e/*.spec.ts` | 7 execuções | Área pública; cadastro com validação; login inválido; fluxo completo (dados com CEP automático, cliente, produto com estoque, emissão de NF-e, download de XML e PDF, estoque, financeiro, painel, cancelamento, notificações); financeiro (baixa), pedido → nota, upgrade de plano, chamado, configuração fiscal, tema, integrações, sessões, exportação LGPD, logout; layout móvel (Pixel 7) |

## Resultados

| Verificação | Comando | Resultado |
|---|---|---|
| Tipos | `npm run typecheck` | OK nos 3 pacotes (tsc 5.9, modo estrito) |
| Lint | `npm run lint` | OK, 0 erros e 0 avisos (ESLint 9 + typescript-eslint + react-hooks) |
| Formatação | `npm run format:check` | OK (Prettier 3.6) |
| Unitários e integração | `npm test` | 65 de 65 passaram (13 + 47 + 5) |
| API contra PostgreSQL 16.15 | `TEST_DATABASE_URL=postgres://… npm test -w @finc/api` | 47 de 47 passaram (cada arquivo de teste usa um banco criado e removido na hora) |
| Build | `npm run build` | OK. Web: cerca de 225 kB gzip no total (JS 110 + 97 + 18 kB, CSS 18 kB) |
| E2E (build local, PGlite) | `npx playwright test` | 7 de 7 passaram |
| E2E (imagem Docker + PostgreSQL 16.10, `NODE_ENV=production`) | `E2E_BASE_URL=http://127.0.0.1:3333 npx playwright test --project=desktop` | 6 de 6 passaram |
| Duplicação | `npm run jscpd` | 0,60% (4 clones pequenos; 15 linhas são a repetição intencional dos tokens do tema escuro no CSS) |
| Auditoria | `npm audit` | 1 alerta high (`node-forge`, sem correção publicada; ver `autenticacao-e-seguranca.md`) |
| Segredos | `bash scripts/check-secrets.sh` | Nenhum segredo encontrado |

## Como executar

```bash
npm test                      # shared + API (PGlite em memória) + web
npm run build && npx playwright test     # E2E (sobe a API e um stub de CEP sozinho)
TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres npm test -w @finc/api   # API contra PostgreSQL real
bash scripts/test.sh          # todas as verificações em sequência (SKIP_E2E=1 pula o Playwright)
```

## Observações

- O ViaCEP real não pôde ser acessado no ambiente de validação, porque a política de rede bloqueou o domínio. Por isso o E2E usa um stub local (`tests/e2e/viacep-stub.mjs`) com o mesmo contrato. Nos testes da API, o `fetch` é injetado.
- O envio de e-mail e as chamadas à API do Telegram são verificados com implementações falsas injetadas pelo contexto da aplicação: os testes confirmam destinatário, assunto e anexos. Não houve envio real, porque não havia credenciais SMTP nem bot.
- O Playwright usa o Chromium pré-instalado (revisão 1194, compatível com `@playwright/test` 1.56.1).
