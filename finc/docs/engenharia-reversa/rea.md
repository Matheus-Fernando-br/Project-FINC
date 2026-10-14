# Engenharia reversa do REA ("Reverse Engineer Anything")

O repositório analisado foi `https://github.com/morluto/rea`, clonado em diretório separado (`refs/rea`), sem alterações. A análise foi estática: leitura de código, configuração e histórico Git. Na análise dinâmica, a CLI do REA (`npx rea-agents analyze-javascript-application`) foi **executada contra o build da FINC original** (resultado em `auditoria-finc-original.md`).

> O REA é uma ferramenta de engenharia reversa: um servidor MCP e uma CLI para agentes de IA. **Não é um sistema de gestão.** Por isso, o REA serviu de referência de **arquitetura, qualidade e segurança** para a FINC 2.0, e também de **ferramenta** para analisar a FINC original. Nenhum código do REA foi copiado (licença MIT, mas não foi preciso).

## 1. Números

| Métrica | Valor |
|---|---|
| Pacote | `rea-agents` 6.4.0, licença MIT, ESM |
| TypeScript em `src/` | 1.858 arquivos, cerca de 416 mil linhas (com 450 testes colocalizados) |
| Testes em `tests/` | 792 arquivos `*.test.ts`, cerca de 225 mil linhas |
| Scripts npm / `.mjs` | 205 / 301 |
| Workflows de CI | 26 |
| Commits | 2.984, de 2026-04-14 a 2026-10-14 |
| Conventional Commits | Cerca de 88% (2.619 de 2.984) |
| Contribuidores (shortlog) | 223 identidades. O mantenedor principal tem 1.455 commits; há duplicatas e bots |

## 2. Arquitetura

- **Entradas:** `package.json#bin` aponta `rea` e `rea-agents` para `scripts/rea.mjs`, que despacha em três modos:
  - `mcp`: servidor stdio, em `dist/mcp/main.js`;
  - `mcp doctor`;
  - CLI one-shot, em `dist/cli-runtime/cli.js`.
- **`src/main.ts`:** executa, em sequência, `snapshotEnvironment`, `parseConfig` (Zod), `createLogger` (pino), `createBinarySession` e `serveStdio`. O desligamento é idempotente e as dependências são injetáveis.
- **Camadas** (regra do `AGENTS.md`: "Dependencies flow inward"):
  - `domain/`: Evidence, Result e erros, código puro;
  - `contracts/`: schemas Zod por ferramenta;
  - `config/`;
  - `application/`: fluxos compartilhados entre CLI e MCP;
  - `composition/`: factories;
  - adaptadores `server/` (MCP) e `cli/`;
  - providers: hopper, ghidra, ida, rizin, dotnet, wasm, android, browser e outros;
  - `process/`: processos com dono, prazos e limites;
  - `bridge/`: Python, Java e Swift executados dentro das ferramentas externas.

```
 CLI (incur)        MCP stdio
 src/cli.ts         src/main.ts -> src/server/*
       \                /
        src/application/*   <- src/composition/*
               |
     providers (hopper | ghidra | ida | browser | ...)
               |
     src/process (dono, deadlines, limites) -> bridge/* (Python/Java/Swift)
               |
     src/domain + src/contracts (puros, Zod, Result, erros tagueados)
```

## 3. Qualidade e ferramentas

- **TypeScript estrito:** `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
- **Vitest com projetos por camada:** domain, services, adapters, boundary, acceptance, conformance. A cobertura mínima vai de 60% a 68%, com shards e merge da cobertura.
- **oxlint:** limites de complexidade, até 500 linhas por arquivo e 100 por função, e `no-restricted-imports` para impor as fronteiras entre camadas.
- **Outras ferramentas:**
  - oxfmt (formatação);
  - **jscpd** (duplicação abaixo de 3,5%);
  - **knip** (código e dependências mortos);
  - **Stryker** (mutação, informativa);
  - husky (`pre-commit` com lint-staged e `pre-push` com `check:fast`);
  - release-please.
- **CI:** jobs selecionados por tipo de mudança, actions fixadas por SHA, publicação no npm com *provenance* e verificação de que o SHA publicado é o mesmo que foi revisado.
- **Licenças:** inventário gerado a partir do lockfile (`licenses:check`) e `THIRD_PARTY_NOTICES.md`.

## 4. Contratos, erros e evidências

- **Zod como fonte da verdade.** O JSON Schema é derivado do Zod e validado com AJV. Catálogos gerados são verificados no CI.
- **`Result<T,E>`** com erros tagueados (`_tag`, `remediationAction`, `userMessage`) e um catálogo de erros visíveis ao usuário.
- **Modelo de Evidence:** cada resultado traz `confidence` (observed, derived ou inferred), `limitations[]`, `coverage` e `residual_unknowns`. O princípio é que um vazio sob cobertura parcial não prova ausência.
- **Orçamento de resposta de 10 MiB:** em vez de truncar em silêncio, a resposta pagina ou exporta.

## 5. Segurança

- Os bridges usam tokens de capacidade por sessão, trafegados por descritores privados. O próprio projeto declara que **não é um sandbox**.
- A propriedade de processos é verificada com *run token* e *start identity*, nunca só pelo PID.
- O sistema de arquivos usa `realpath` e handles próprios, com orçamento contra *zip bombs*.
- A redação de credenciais funciona inclusive em saídas truncadas. Arquivos são gravados de forma atômica com permissão `0o600`.

## 6. Persistência

Não há banco de dados de aplicação. O REA guarda apenas cache de snapshots por `sha256` e perfil, mais um ledger de evidências em memória que pode ser exportado como bundle JSON canônico.

## 7. Pontos fracos observados

- Tamanho e complexidade extremos: mais de 640 mil linhas de TypeScript construídas em cerca de 6 meses.
- Dependência de motores proprietários (Hopper, IDA, JEB) e de hosts específicos para os testes reais.
- Cobertura mínima modesta para o tamanho do código. A mutação não bloqueia o CI.
- Toolchain de ponta (TypeScript 7, Vitest 5, oxfmt antes da 1.0), com risco de quebra.
- Autoria concentrada em poucos mantenedores (*bus factor*).

## 8. O que a FINC 2.0 adotou do REA

| Prática do REA | Aplicação na FINC 2.0 |
|---|---|
| Contratos Zod como fonte única | `packages/shared/src/schemas.ts`, usado pela API (validação) e pela web (formulários) |
| Configuração validada na borda (`parseConfig`) | `apps/api/src/config.ts` valida todas as variáveis e falha cedo, listando os problemas |
| Erros tagueados e catálogo de mensagens ao usuário | `packages/shared/src/erros.ts` e `AppError`. O formato de erro é único em toda a API |
| Composition root e dependências injetáveis | `bootstrap.ts` e `app.ts`. Os testes trocam SMTP, Telegram e ViaCEP por versões falsas |
| Camadas com dependência para dentro | `modules`, que dependem de `services`, `db` e `shared` |
| "Evidências e limitações", sem descartar dados em silêncio | Relatório de importação linha a linha (importados, rejeitados com motivo, colunas ignoradas) |
| Detecção de duplicação (jscpd) | `npm run jscpd`, com limite de 5%. A FINC original tinha 9,64% |
| Inventário de licenças | `scripts/licenses.mjs` gera `docs/licencas-dependencias.md` |
| Testes por fronteira | Unitários (`shared`, `web`), integração HTTP com banco real (API) e E2E (Playwright) |
| Redação de segredos em logs | `pino` com `redact` de cookies, CSRF, senhas e tokens |
| Gravação de segredos com permissão restrita | `install.sh` cria o `.env` com `chmod 600` |
