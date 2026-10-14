# Matriz comparativa: REA × Bling × FINC original × FINC 2.0

Legenda:

| Símbolo | Significado |
|---|---|
| ✅ | Implementado e funcional (na FINC 2.0, coberto por teste automatizado quando indicado) |
| ◐ | Parcial ou simulado |
| ❌ | Ausente |
| — | Não se aplica (o REA é uma ferramenta de engenharia reversa, não um ERP) |
| ⏳ | Pendente de credenciais ou contrato externo |

As colunas trazem a FINC original (**orig.**) e a FINC 2.0 (**2.0**).

## Funcionalidades de negócio

| Funcionalidade | Bling (ref. pública) | FINC orig. | FINC 2.0 | Testes 2.0 |
|---|---|---|---|---|
| Cadastro e login (e-mail ou CPF/CNPJ) | ✅ | ✅ | ✅ | API + E2E |
| Recuperação de senha | ✅ | ✅ (Supabase) | ✅ (SMTP) / ⏳ sem SMTP | API |
| Sessões revogáveis e bloqueio por tentativas | ✅ | ❌ | ✅ | API |
| Perfil do emitente e consulta de CEP | ✅ | ✅ | ✅ | API + E2E |
| Clientes (CRUD, busca, importação, exportação) | ✅ | ◐ (sem busca no servidor nem exportação) | ✅ | API + E2E |
| Produtos com dados fiscais | ✅ | ✅ | ✅ (NCM, CFOP e alíquotas validados) | API + E2E |
| Serviços (CNAE, LC 116, ISS) | ✅ | ✅ | ✅ | API |
| Controle de estoque | ✅ | ❌ | ✅ | API + E2E |
| Pedidos de venda → nota | ✅ | ❌ | ✅ | API + E2E |
| Emissão de NF-e, NFC-e e NFS-e (homologação/local) | ✅ | ◐ (sem persistência, número fixo) | ✅ | API + E2E |
| PDF e XML do documento | ✅ | ◐ (gerado no navegador) | ✅ (servidor) | API + E2E |
| Cancelamento com justificativa | ✅ | ❌ | ✅ (estorna estoque e financeiro) | API + E2E |
| Transmissão SEFAZ/Prefeitura | ✅ | ❌ | ⏳ (provedor fiscal) | — |
| Contas a pagar e a receber | ✅ | ❌ | ✅ | API + E2E |
| Painel de indicadores | ✅ | ◐ (dados fictícios) | ✅ (dados reais) | API + E2E |
| Contadores e envio de documentos | ✅ | ◐ (só cadastro) | ✅ (envio por e-mail) / ⏳ sem SMTP | API |
| Planos BÁSICO e BLACK com limites | — | ◐ (limites só no front) | ✅ (limites no servidor e regra de downgrade) | API + E2E |
| Cobrança da assinatura | ✅ | ◐ (tela de cartão fictícia) | ⏳ (gateway) | — |
| Certificado digital A1 | ✅ | ◐ (só visual) | ✅ (validação e cofre cifrado) | API |
| Notificações | ✅ | ◐ (simuladas) | ✅ (na plataforma e por e-mail) | API + E2E |
| Suporte por chamados | ✅ | ◐ (rotas sem autenticação, lista quebrada) | ✅ (+ painel admin + Telegram) | API + E2E |
| Configurações fiscais e preferências persistidas | ✅ | ❌ (estado local) | ✅ | API + E2E |
| Aparência (tema, fonte, negrito) | — | ✅ | ✅ | E2E |
| LGPD (exportar e excluir conta, trilha de atividade) | ◐ | ❌ | ✅ | API |
| Integração com e-commerce e marketplaces | ✅ | ❌ (prometida no FAQ) | ❌ (pendência) | — |
| Boletos | ✅ | ❌ (prometido) | ❌ (pendência) | — |
| Matriz e filial | ✅ | ❌ | ❌ | — |

## Arquitetura e qualidade

| Aspecto | REA | FINC orig. | FINC 2.0 |
|---|---|---|---|
| Linguagem | TypeScript estrito | JavaScript | TypeScript estrito (`noUncheckedIndexedAccess`) |
| Contratos de dados | Zod como fonte única | Ad hoc | Zod compartilhado entre API e web |
| Configuração validada | `parseConfig` (Zod) | Parcial | `parseConfig` (Zod), que falha cedo |
| Erros | Tagueados, com catálogo | Mensagens soltas e vazamento interno | Catálogo de códigos, sem vazamento |
| Banco e migrações | Sem banco | Supabase, sem migrações versionadas | PostgreSQL + migrações SQL + PGlite para desenvolvimento e testes |
| Testes | Cerca de 1.240 arquivos (unitário, boundary, acceptance) | **Nenhum** | 65 testes em 6 arquivos (shared 13, API 47 — em PGlite e PostgreSQL 16 —, web 5) + 7 execuções E2E (Playwright) |
| Lint e formatação | oxlint e oxfmt | ESLint do CRA | ESLint 9 + typescript-eslint + Prettier |
| Duplicação (jscpd) | Abaixo de 3,5% (CI) | 9,64% | **0,60%** (`npm run jscpd`, limite de 5%) |
| Licenças | Inventário verificado | ❌ | `docs/licencas-dependencias.md` (336 pacotes) |
| Auditoria de dependências | `deps:check` | 11 (back) + 110 (front) vulnerabilidades | 1 alerta high (`node-forge`, sem correção disponível, função não usada) |
| Empacotamento | npm com provenance | Vercel e Render manuais | Docker multi-stage + compose, scripts Linux |
