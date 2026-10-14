# Decisões técnicas (ADRs resumidos)

## ADR-01: Nova plataforma em `finc/`, preservando a original

- **Contexto:** a FINC original precisava ser preservada como fonte de requisitos.
- **Decisão:** a FINC 2.0 é um monorepo independente em `finc/`. As pastas da versão original (`Back-End/` e `Front-End/`) foram removidas depois da migração; continuam disponíveis no histórico do Git.
- **Consequência:** é possível comparar as duas versões lado a lado. As rotas antigas do front redirecionam para as novas.

## ADR-02: PostgreSQL próprio no lugar do Supabase

- **Contexto:**
  - o schema não estava versionado;
  - o RLS ficava fora do repositório;
  - a autenticação dependia de chave `service_role` no back-end;
  - não dava para testar sem a nuvem.
- **Decisão:** PostgreSQL com migrações SQL versionadas e isolamento por `usuario_id` aplicado em todas as consultas. Para desenvolvimento e testes, usa-se o **PGlite**, o PostgreSQL compilado para WASM, por trás da mesma interface `Db`.
- **Consequência:**
  - instalação limpa sem Docker nem servidor de banco;
  - os testes rodam contra PostgreSQL de verdade (PGlite e também o PostgreSQL 16 nativo);
  - em produção, a configuração exige PostgreSQL.

## ADR-03: Autenticação própria com sessão opaca

- **Decisão:** token aleatório em cookie HttpOnly, com o hash guardado no banco, mais CSRF por HMAC da sessão e senhas em `scrypt`, nativo do Node.
- **Motivo:**
  - revogação imediata (logout, troca de senha, sessões);
  - nenhuma dependência nativa (bcrypt/argon2 exigiriam compilação);
  - nenhum segredo de terceiros no servidor.

## ADR-04: Mesma origem em produção

- **Decisão:** a API serve o build da SPA (`SERVE_WEB=true`).
- **Motivo:** a FINC original usava Vercel e Render em domínios diferentes, o que exigia `SameSite=None` e tornava o CSRF frágil (o cookie não era legível pelo outro domínio). Com a mesma origem, `SameSite=Lax` basta.
- **Alternativa:** `CORS_ORIGINS` permite separar front e API em subdomínios do mesmo site (ex.: `app.` e `api.`). Domínios de sites diferentes não são suportados de propósito, porque exigiriam `SameSite=None`.

## ADR-05: Documentos gerados no servidor e persistidos

- **Decisão:** o documento é gravado com um **snapshot** do emitente, do destinatário e dos itens. O PDF (pdfkit) e o XML são gerados sob demanda a partir desse snapshot.
- **Motivo:**
  - imutabilidade fiscal: alterar o cadastro do cliente não altera documentos já emitidos;
  - eliminar html2pdf e jsPDF, que tinham vulnerabilidades críticas;
  - numeração e auditoria confiáveis.
- **Honestidade:** sem um provedor fiscal homologado, o documento leva a marca "SEM VALOR FISCAL", e o ambiente de produção bloqueia a emissão (ADR-08).

## ADR-06: Regra de cálculo do total

- **Contexto:** a FINC original somava ICMS, ISS e PIS/COFINS ao total. Na maior parte dos casos reais, esses tributos são "por dentro", ou seja, já estão no preço.
- **Decisão:** a regra original continua como padrão (`somar_impostos = true`), para preservar o comportamento. Pode ser desligada em **Configurações › Fiscal**.
- **Implementação:** o cálculo está em `packages/shared/src/fiscal.ts` e é o mesmo na prévia da tela e no servidor.
- **Validação:** a alíquota precisa estar entre 0 e 100%. A heurística original `normalizeAliquota`, que dividia valores como 451020 por 10000, foi substituída por essa validação.

## ADR-07: Limites de plano aplicados no servidor

- **Contexto:** na original, os limites existiam só na interface.
- **Decisão:** `assertLimite()` roda dentro da mesma transação da escrita, na criação, na importação e na emissão. O downgrade é recusado quando o uso atual excede os limites do plano de destino.

## ADR-08: Integrações sem credenciais ficam desligadas, de forma explícita

- **Decisão:** cada integração (SMTP, Telegram, cofre de certificado, provedor fiscal, gateway de pagamento) aparece com sua situação real.
- **Comportamento sem credencial:** a API responde `503 INTEGRACAO_NAO_CONFIGURADA` com uma explicação. Nenhuma tela simula sucesso. Por isso o formulário de cartão fictício foi removido.

## ADR-09: CRUD declarativo

- **Contexto:** a duplicação na original era de 9,64%, e o maior clone tinha 330 linhas.
- **Decisão:**
  - na API, uma fábrica (`crudRoutes`) recebe a definição da entidade;
  - na web, `CadastroForm` e `CadastroLista` recebem configurações de campos e colunas.
- **Resultado:** adicionar uma entidade custa cerca de 30 linhas de configuração.

## ADR-10: Versões de dependências fixadas e auditadas

- **Decisão:** versões exatas no `package.json`, `package-lock.json` versionado e `overrides` para corrigir dependências transitivas (como `uuid` 11.1.1).
- **Testes:** Vitest 5, adotado porque as versões 3 e 4 tinham alertas críticos.
- **Node:** 22.12 ou superior.
