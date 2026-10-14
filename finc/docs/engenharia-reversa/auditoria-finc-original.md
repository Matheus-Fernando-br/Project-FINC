# Relatório de Auditoria — Project-FINC (original)

Data: 2026-10-14. Cópia auditada em `/home/user/audit` (o repositório original `/home/user/Project-FINC` não foi alterado). Todos os resultados abaixo vêm de comandos realmente executados.

## Ambiente
- Node v22.22.0, npm 10.9.4, Linux.
- Cópia criada com `cp -r Back-End Front-End /home/user/audit/`. Na cópia, `Back-End/node_modules` (versionado no git) foi apagado e reinstalado via `npm ci`.
- Artefatos gerados: `be-audit.json`, `fe-audit.json`, `fe-ci.log`, `fe-build.log`, `be-server.log`, `jscpd/jscpd-report.json`, `rea-output.json` (11 MB), `rea-stderr.log`.

## Backend
### Dependências
- `npm ci`: OK (103 pacotes, 2s).
- `node --check` em todos os 27 arquivos de `src/`: todos OK, sem erro de sintaxe.
- `npm outdated`: @supabase/supabase-js 2.89.0→2.117.3, axios 1.13.5→1.20.0, cors 2.8.5→2.8.6, dotenv 16.6.1 (latest 18.0.7), express 4.22.1→4.22.3 (latest 5.3.0), express-rate-limit 8.3.2→8.7.1, helmet 8.1.0→8.3.0.

### npm audit: 11 vulnerabilidades (1 critical, 5 high, 5 moderate)
- critical: proxy-addr (falsificação de IP via IPv6 mapeado em IPv4; impacta `trust proxy`/rate limit).
- high: axios (direta; SSRF por bypass de NO_PROXY e prototype pollution), form-data (injeção de CRLF), ip-address, path-to-regexp (ReDoS), ws.
- moderate: express (direta), express-rate-limit (direta), body-parser, follow-redirects, qs.
- Todas têm correção disponível via `npm audit fix` (sem mudança de major).

### Execução dinâmica (SUPABASE_URL=http://127.0.0.1:9, SUPABASE_SERVICE_ROLE_KEY=x, PORT=3999)
O servidor subiu ("API rodando na porta 3999"). Foi encerrado no final.

| Requisição | HTTP | Corpo |
|---|---|---|
| GET / | 200 | `{"status":"API FINC ONLINE 🚀"}` |
| GET /planos | 500 | `{"erro":"TypeError: fetch failed"}` (mensagem de erro interna vazada) |
| POST /auth/login `{email,senha}` | 401 | `{"error":"Usuário ou senha inválidos"}` (a falha de infraestrutura é mascarada como 401) |
| GET /clientes (sem cookie) | 401 | `{"error":"Não autenticado"}` |
| POST /chamados `{}` | 500 | `{"erro":"Cannot read properties of undefined (reading 'id')"}` (TypeError em chamados.js:45) |
| GET /mensagens/1 (sem auth) | 200 | `[]` (o erro do Supabase é engolido e a resposta sai como 200) |
| GET /chamados/1 (sem auth) | 404 | `{"erro":"Chamado não encontrado"}` |
| PUT /chamados/1/encerrar (sem auth) | 404 | `{"erro":"Chamado não encontrado"}` |
| POST /feedback (sem auth) | 500 | `{"erro":"Erro ao enviar feedback"}` (TELEGRAM_TOKEN ausente) |
| POST /mensagem (sem auth) | 404 | `{"erro":"Chamado não encontrado"}` |
| POST /telegram-webhook (sem auth, callback FECHAR:1) | 200 | `OK` (chegou a executar o UPDATE no Supabase antes de falhar no Telegram) |
| POST /auth/register `{}` | 400 | `{"error":"Nome social inválido"}` |

**Endpoints sem autenticação** (todos em server.js:98-108): `POST /chamados`, `POST /mensagem`, `GET /mensagens/:chamado_id`, `POST /feedback`, `GET /chamados/:id`, `PUT /chamados/:id/encerrar`, `POST /telegram-webhook`. Também não passam por CSRF. Públicos por design: `GET /`, `GET /planos`, `POST /auth/login`, `POST /auth/register` (este último sem rate limit). As rotas de clientes, produtos, serviços, contadores, perfil e planos privados usam `authMiddleware` (confirmado: 401 sem cookie).

## Frontend
### Dependências
- `npm ci`: OK (1425 pacotes, 13,5s), com vários avisos de deprecated (eslint 8, svgo 1, babel proposals).
- `npm outdated`: react 19.1.1→19.3.0, react-router-dom 7.8.2→7.18.4, axios 1.13.2→1.20.0, html2pdf.js 0.12.1 (latest 0.14.0), recharts 3.2.1→3.10.1, framer-motion, @supabase/supabase-js, web-vitals 2.1.4 (latest 6.2.3) e outros.

### npm audit: 110 vulnerabilidades (5 critical, 83 high, 17 moderate, 5 low)
- critical: **html2pdf.js** (direta, XSS; correção só na 0.14.0, que é major), **jspdf** (transitiva via html2pdf: LFI/path traversal, injeção de JS em PDF, DoS), proxy-addr, shell-quote, websocket-driver.
- high relevantes em runtime: **xlsx** (direta; prototype pollution e ReDoS, **sem correção no npm**), **react-router / react-router-dom** (diretas; XSS via open redirect e outras falhas, correção disponível), **axios** (direta). As demais high vêm do toolchain do react-scripts (jest, webpack-dev-server, svgo, nth-check etc.) e afetam só o desenvolvimento.
- moderate: dompurify (via jspdf), follow-redirects, qs, uuid, postcss etc.

### Build (`CI=true npx react-scripts build`)
- **Sucesso**: "Compiled successfully." 0 avisos de ESLint (apenas o aviso de Browserslist/caniuse-lite com 13 meses).
- Tamanhos gzip: `main.75f97817.js` 618.68 kB, `455.4ce7c2ad.chunk.js` 43.26 kB, `main.a03da685.css` 13.36 kB, `977.d461343e.chunk.js` 8.69 kB. O CRA avisa: "The bundle size is significantly larger than recommended."
- Source maps (`*.js.map`) são gerados e publicados no build, o que expõe o código-fonte original.

### Testes (`CI=true npx react-scripts test --watchAll=false`)
- "No tests found, exiting with code 1": 60 arquivos verificados, 0 testes. Não existe nenhum `*.test.js`, `*.spec.js` ou `setupTests.js`.

## Duplicação (jscpd@4, min-tokens 50)
- Total: **9.64% das linhas duplicadas** (1456 de 15101 linhas), 58 clones em 96 arquivos; 11.75% dos tokens.
- JavaScript: 10.56% (1386 linhas, 57 clones). CSS: 3.54% (1 clone).
- Maiores clones:
  1. 330 linhas: `servico/editarServico.js:59-388` ↔ `servico/telaCadastroServico.js:38-365`
  2. 140 linhas: `produto/editarProduto.js:59-198` ↔ `produto/telaCadastroProduto.js:37-192`
  3. 133 linhas: `produto/telaCadastroProduto.js:44-176` ↔ `servico/telaCadastroServico.js:57-192`
  4. 71 linhas: `clientes/cliente.css:1-71` ↔ `produtos_servicos/produtos.css:14-84`
  5. 60 linhas: `tela2Escolha.js:19-78` ↔ `tela3EscolhaPlanilha.js:19-78`
  6. 50 linhas: `telaCadastroProduto.js:189-238` ↔ `telaCadastroServico.js:228-280`
  7. 27 linhas: `clientes/tela1Clientes.js:217-243` ↔ `produtos_servicos/tela1.js:188-214`
  8. 25 linhas (Back-End): `cliente.controller.js:116-140` ↔ `cliente.controller.js:52-76`

## REA (`rea-agents@latest analyze-javascript-application build --json`)
- **Funcionou** (exit 0). Saída completa em `/home/user/audit/rea-output.json` (11 MB).
- Estatísticas: 10 arquivos relevantes, 3 JS parseados, 0 falhas de parse, 115 módulos, 419 findings, 739.616 nós de AST visitados, 0 contradições de integridade.
- Grafo: 1362 nós (1154 source-module recuperados via source map, 126 javascript-module, 47 endpoint, 17 storage, 2 chunks, 2 workers, 4 source-maps) e 1703 arestas.
- Módulos da aplicação recuperados pelos source maps: 84 (inclui todos os arquivos de `src/`, o que confirma que o código-fonte completo está exposto em produção).
- Pacotes de terceiros no bundle: 54. Os maiores: recharts (180 módulos), framer-motion (129), core-js (110), motion-dom (105), es-toolkit (57), jspdf (46), d3-*, @reduxjs/toolkit, html2canvas, @supabase/*.
- Endpoints detectados: rotas SPA (/clientes, /produtos, /configuracao/*, /emitir-nota/*, /TelaInicial/* etc.) e as URLs fixas `https://project-finc.onrender.com/`, `/mensagem` e `/feedback`.
- Chaves de localStorage: `token`, `user`, `user_name`, `remember_me`, `remember_user_login`, `theme`, `fontSize`, `bold`, `emitirNotaData`, `emitirNotaVoltar`, `supabase.gotrue-js.locks.debug`.
- Superfície Electron/IPC: nenhuma (esperado em uma SPA web).

## Segredos (valores redigidos)
- **`Front-End/.env` está versionado no git** (o .gitignore só ignora `.env.local`/`.env.*.local`). Chaves: `REACT_APP_API_URL`, `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`. O JWT tem `role: anon` (pública por natureza, mas vai parar no repositório e no bundle) e expira em 2106. Ele aparece em 3 commits (cc11df6, 0cf9a74, 9fc0be3).
- `git log -p --all -S SERVICE_ROLE`: só referências a `process.env.SUPABASE_SERVICE_ROLE_KEY` no código (supabase.js, auth/profile controllers) e uma linha `SUPABASE_SERVICE_ROLE_KEY=...` no README.md (commit 8f18761) com valor **placeholder** (28 caracteres, não é JWT). Uma varredura de todos os JWTs do histórico encontrou só 2 JWTs distintos, ambos `role: anon`. **Nenhuma service-role key real foi encontrada.** Padrões de token do Telegram e `sb_secret_` no histórico: 0.
- Não há `Back-End/.env` versionado.

## node_modules versionado
- **`Back-End/node_modules` está versionado: 1524 arquivos rastreados.** Não existe `.gitignore` no Back-End nem na raiz.

## Achados
1. **[Crítico] Rotas de chamados/mensagens sem autenticação nem verificação de dono (IDOR)**: `Back-End/src/server.js:98-103`. Qualquer pessoa lê as mensagens de qualquer chamado (`GET /mensagens/:id`, chamados.js:174), lê qualquer chamado (`GET /chamados/:id`, chamados.js:186), escreve mensagens (`POST /mensagem`, chamados.js:110) e encerra qualquer chamado (`PUT /chamados/:id/encerrar`, chamados.js:209).
2. **[Crítico] `POST /chamados` confia no `user` enviado pelo cliente**: `Back-End/src/telegram/chamados.js:37,45`. Permite criar chamados em nome de qualquer `user_id`. Com corpo `{}` dá TypeError e resposta 500 com a mensagem interna (confirmado).
3. **[Crítico] Webhook do Telegram sem segredo**: `server.js:108` e `telegram/webhook.js:14`. Não valida `X-Telegram-Bot-Api-Secret-Token`. Qualquer um pode aceitar ou encerrar chamados e inserir mensagens como "admin" (confirmado: 200 e UPDATE executado).
4. **[Alto] `POST /feedback` aberto**: `server.js:101` e `telegram/feedback.js`. Permite spam ilimitado para o chat do Telegram, só limitado pelo rate limit global de 600 requisições a cada 15 min, com nome/e-mail falsificáveis.
5. **[Alto] Mass assignment em update**: `produto.controller.js:29` e `servico.controller.js:29` fazem `.update(req.body)`. O usuário pode alterar `user_id` ou `id` e transferir registros para outra conta. O import (`produto.controller.js:45`, `cliente.controller.js:206`) espalha campos arbitrários do cliente.
6. **[Alto] Frontend chama endpoint inexistente**: `Front-End/src/app/configuracao/sub-config/chamado/chamado.js:59` usa `GET ${API_URL}/chamados/user/${user.id}`. Essa rota não existe; ela cai em `GET /chamados/:id` com id="user" e volta 404, então a lista de chamados fica sempre vazia.
7. **[Alto] URLs de produção fixas no código**: `chat.js:24,31,50,119` e `ajuda.js:28,54` (`https://project-finc.onrender.com`) ignoram `REACT_APP_API_URL`. Além disso, essas chamadas não enviam `credentials`/CSRF. `EsqueciSenha.js:43` fixa `https://finc-seven.vercel.app/reset-password`, e `server.js:37` fixa a origem CORS da Vercel.
8. **[Alto] Dependências vulneráveis em runtime**: xlsx (sem correção no npm; usado na importação de planilhas), html2pdf.js/jspdf (critical), react-router-dom, axios. No backend: axios, express, proxy-addr (critical).
9. **[Médio] Vazamento de erros internos**: `planos.controller.js:58` (e 83, 85, 119, 131...) e `chamados.js:54,65,132` devolvem `error.message` ou o objeto de erro do Supabase. Confirmado: `GET /planos` respondeu `"TypeError: fetch failed"`.
10. **[Médio] `listarMensagens` sem tratamento de erro**: `chamados.js:174-184`. Ignora `error` e responde 200 `[]` mesmo com o banco fora (confirmado).
11. **[Médio] `/auth/register` sem rate limit**: `auth.routes.js:19`.
12. **[Médio] `.env` do frontend versionado**: `Front-End/.env` (anon key, valor redigido) e `.gitignore` incompleto.
13. **[Médio] `Back-End/node_modules` versionado** (1524 arquivos), sem `.gitignore` no backend.
14. **[Médio] Source maps publicados no build** (`build/static/js/*.map`): o REA recuperou os 84 módulos originais de `src/`. Falta `GENERATE_SOURCEMAP=false`.
15. **[Médio] Dados mockados no dashboard**: `Front-End/src/app/Home.js:45-70` tem arrays fixos (`clientes`, `produtos`, `notasEmitidas`, `distribuicaoProdutos`) com "Cliente A", "Produto X" e anos 2022-2025. Os gráficos não refletem dados reais.
16. **[Médio] Tela de notificações 100% simulada**: `Front-End/src/app/notificacao/tela1Notificacao.js:102,128,132,136,145,149`. Só tem estado local e `alert()` ("Teste simulado..."), sem nenhuma chamada à API.
17. **[Baixo] Uso de `alert()`**: 21 ocorrências em 10 arquivos (notificacao 6, tela1EmitirNota 3, ajuda 3, tela1 2, tela1Clientes 2, api.js 1, MenuSair 1, tela2Escolha 1, tela3EscolhaPlanilha 1, tela2EmitirNota 1).
18. **[Baixo] Protocolo de chamado com `Math.random()`** (`chamados.js:39`): 6 dígitos, sem checagem de colisão.
19. **[Baixo] Login mascara falhas de infraestrutura como 401** (`auth.controller.js:206-209`), o que dificulta o diagnóstico (confirmado com Supabase inacessível).
20. **[Baixo] Estado "modo responder" do webhook só em memória** (`webhook.js`, `Map` `responderPendenciaPorUsuario`): é perdido no restart e não funciona com mais de uma instância.
21. **[Qualidade] Sem testes** (0 arquivos de teste), bundle principal de 618 kB gzip e 9.64% de duplicação, concentrada nas telas de cadastro e edição de produto/serviço.
