# Autenticação e segurança

## Modelo de autenticação

| Aspecto | FINC original | FINC 2.0 |
|---|---|---|
| Provedor | Supabase Auth (JWT de acesso guardado em cookie pela API) | Autenticação própria na API |
| Senha | Gerenciada pelo Supabase | `scrypt` (N=2^15, r=8, p=1, sal de 16 bytes), sem dependência nativa |
| Sessão | JWT de 2 h, sem revogação no servidor | Token opaco aleatório de 256 bits. O banco guarda só o hash SHA-256. Validade configurável (`SESSION_TTL_HORAS`, padrão 8 h). A sessão pode ser revogada individualmente, no logout, na troca de senha ou na redefinição |
| Cookie | `access_token` HttpOnly, `SameSite=None` em produção | `finc_sessao` HttpOnly, `SameSite=Lax`, `Secure` em produção, mesma origem |
| CSRF | Biblioteca `csrf` com cookie legível. Quebrava entre domínios diferentes | HMAC(SESSION_SECRET, id da sessão), devolvido no JSON de login e `/me` e exigido no header `X-CSRF-Token` em métodos de escrita |
| Login | E-mail ou CPF/CNPJ | Mantido. A mensagem de erro é genérica e o hash é comparado em tempo constante mesmo quando o usuário não existe |
| Força bruta | 5 tentativas por IP a cada 15 min | 10 tentativas por IP a cada 15 min, mais bloqueio da conta por 15 min após 5 falhas seguidas |
| Recuperação de senha | Supabase, com URL da Vercel fixa no código | Token de uso único válido por 1 h, enviado por SMTP. A resposta é igual exista ou não a conta |
| Papéis | Não havia | `usuario` e `admin`. O admin acessa o painel de chamados (`npm run admin:promover -- email`) |

## Controles implementados

- **Isolamento entre contas:** toda consulta filtra por `usuario_id` vindo da sessão. Os testes confirmam que outra conta recebe 404 ao ler, alterar, excluir ou referenciar registros alheios.
- **Sem mass assignment:** a fábrica CRUD grava apenas as colunas declaradas. `usuario_id` e `id` vindos do corpo da requisição são ignorados (há teste para isso).
- **Validação na borda:** Zod em todas as entradas. CPF e CNPJ têm dígito verificador validado. NCM, CFOP, CNAE e alíquotas são checados. O banco reforça tudo com `CHECK` constraints.
- **Cabeçalhos de segurança:** helmet com CSP `default-src 'self'`, `frame-ancestors 'self'`, `object-src 'none'`, `nosniff`, `Referrer-Policy: same-origin` e HSTS em produção. `x-powered-by` fica desativado.
- **Rate limit:** global, além de limites específicos para login, cadastro, senha e escrita.
- **Logs:** pino com redação de cookies, headers CSRF, senhas e tokens.
- **Uploads:** multer em memória, com limite de tamanho (certificado: 64 KB; planilha: 5 MB e 2000 linhas) e checagem de extensão.
- **CSV:** proteção contra injeção de fórmulas na exportação (prefixo `'`).
- **XML e PDF:** todos os campos do XML passam por escape (há teste com `<`, `>` e `&`).
- **Certificado A1:** o arquivo e a senha são cifrados com AES-256-GCM e a chave fica em `CERT_ENCRYPTION_KEY`. O certificado é validado (senha, chave privada presente, validade e CPF/CNPJ igual ao da conta) e nunca é devolvido pela API.
- **Webhook do Telegram:** exige o segredo `X-Telegram-Bot-Api-Secret-Token`, comparado em tempo constante, e aceita somente o chat configurado. Na FINC original, o webhook era público.
- **Erros:** nenhum detalhe interno (stack, mensagem do driver) chega ao cliente. Na FINC original vazavam, como no `TypeError: fetch failed`.
- **LGPD:** exportação dos dados, trilha de atividades e exclusão da conta com confirmação por senha.
- **Segredos:** `.env` fica fora do controle de versão. `scripts/check-secrets.sh` procura chaves privadas, JWTs, tokens do Telegram e da AWS e arquivos `.env`. A configuração recusa iniciar em produção sem `SESSION_SECRET`.

## Vulnerabilidades da FINC original e como foram tratadas

As referências são ao relatório `engenharia-reversa/auditoria-finc-original.md`.

| # | Achado na original | Tratamento na 2.0 |
|---|---|---|
| 1–2 | Rotas de chamados públicas e IDOR (`user_id` vinha do corpo da requisição) | Todas as rotas são autenticadas e verificam o dono |
| 3 | Webhook do Telegram sem segredo | Segredo obrigatório e chat autorizado |
| 4 | `/feedback` aberto (spam) | Autenticado e gravado no banco |
| 5 | Mass assignment em produtos e serviços (`update(req.body)`) | Lista de colunas permitidas |
| 6 | Front chamava `/chamados/user/:id`, rota inexistente | Contrato único e testes de ponta a ponta |
| 7 | URLs de produção fixas no código | Mesma origem e variáveis de ambiente |
| 8 | Dependências vulneráveis (axios, xlsx, html2pdf/jspdf) | Removidas. Planilhas lidas com exceljs e PDF gerado no servidor com pdfkit. `npm audit`: veja o resultado abaixo |
| 9 | Erros internos vazavam | `errorHandler` padronizado |
| 12–13 | `.env` e `node_modules` versionados | `.gitignore` e `check-secrets.sh` |
| 14 | Source maps publicados | `build.sourcemap: false` |
| 15–16 | Dashboard e notificações com dados fictícios | Dados reais do banco |

## Resultado do `npm audit` (2026-10-14)

Depois de atualizar as dependências e aplicar um override de `uuid` para 11.1.1, resta **1 alerta high**:

- **`node-forge` ≤ 1.4.0**, GHSA-86w9-cpqp-85rv: a verificação de assinatura RSA PKCS#1 v1.5 aceita elementos extras. Ainda não há versão corrigida. A FINC usa o `node-forge` apenas para **abrir o PKCS#12** (decifrar e ler metadados do certificado do próprio usuário) e não chama `verify()` em nenhum ponto. Por isso o risco foi **aceito e registrado**. Ação recomendada: atualizar assim que sair a correção, ou migrar para `openssl pkcs12` ou `@peculiar/x509`.
