# Relatório de engenharia reversa

## Objetivo

Reconstruir a FINC a partir de três fontes:

- **REA**: referência técnica de arquitetura e qualidade, e também ferramenta de análise;
- **Bling**: referência de funcionalidades de gestão;
- **FINC original**: fonte obrigatória de requisitos.

## Método

1. **Preservação:**
   - REA clonado em diretório separado (`refs/rea`), sem modificação;
   - FINC original mantida intacta no repositório durante a reconstrução (`Back-End/`, `Front-End/`; hoje removidas e disponíveis no histórico do Git);
   - auditoria dinâmica feita sobre uma **cópia** (`audit/`).
2. **Análise estática:**
   - leitura de todo o código da FINC (27 arquivos de back-end e 60 de front-end), de configurações, rotas e controllers;
   - mapeamento das chamadas do front para a API e inferência do schema do banco;
   - leitura da estrutura, dos contratos, da CI e das políticas do REA;
   - histórico Git dos dois repositórios.
3. **Análise dinâmica da FINC original:**
   - `npm ci`, `npm audit` e `npm outdated` nos dois projetos;
   - API executada com variáveis falsas e sondada por `curl` (status HTTP registrados);
   - build de produção do front-end com CRA;
   - execução dos testes (não existiam);
   - **REA** (`rea-agents analyze-javascript-application`) sobre o build: 115 módulos, 47 endpoints, 84 módulos-fonte recuperados pelos source maps;
   - **jscpd** para medir duplicação;
   - varredura de segredos no histórico Git, com valores redigidos.
4. **Referência funcional do Bling:** pesquisa em fontes públicas (o acesso ao site foi bloqueado no ambiente).
5. **Reconstrução:**
   - nova plataforma `finc/` com os requisitos preservados (ver o mapeamento em `finc-original.md`) e as práticas do REA;
   - validação com testes unitários, de integração em PGlite e PostgreSQL 16, E2E com Playwright, contra build local e contra imagem Docker em produção.

## Ferramentas utilizadas

Git, Node.js 22, npm, curl, Docker e Docker Compose, PostgreSQL 16, PGlite, Playwright e Chromium, Vitest, ESLint, Prettier, TypeScript, jscpd, `npm audit`, REA (`rea-agents`) e pdftoppm (inspeção do PDF gerado). Dois subagentes trabalharam em paralelo: um analisou o REA e o outro auditou a FINC original.

## Documentos

| Documento | Conteúdo |
|---|---|
| [auditoria-finc-original.md](auditoria-finc-original.md) | Resultados brutos da auditoria estática e dinâmica da FINC original (21 achados) |
| [finc-original.md](finc-original.md) | Arquitetura, schema inferido, rotas, telas e regras de negócio preservadas |
| [rea.md](rea.md) | Arquitetura, ferramentas, contratos, segurança do REA e práticas adotadas |
| [bling.md](bling.md) | Módulos de referência e fontes públicas |
| [../matriz-funcionalidades.md](../matriz-funcionalidades.md) | Matriz REA × Bling × FINC original × FINC 2.0 |
