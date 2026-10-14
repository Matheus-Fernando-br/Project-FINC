# Publicar a FINC 2.0: Vercel (front-end) + Render (back-end) + Supabase (banco)

Cada serviço tem uma função:

| Serviço | Função | Endereço atual | O que fica nele |
|---|---|---|---|
| **Vercel** | Front-end (site) | domínio do projeto na Vercel | `finc/apps/web` compilado. Configuração no arquivo `finc/vercel.json` |
| **Render** | Back-end (API) | https://project-finc.onrender.com (serviço `srv-d55d3vfgi27c73eik5ng`) | `finc/apps/api`. Configuração no painel do Render |
| **Supabase** | Banco de dados PostgreSQL | https://bionwcsdrmmtxueypbbt.supabase.co | Tabelas no schema `finc`. As tabelas antigas, em `public`, não são tocadas |

## Como as partes conversam

```
Navegador ──▶ Vercel (site)  ──/api/*──▶  Render (API)  ──SQL──▶  Supabase (PostgreSQL)
             seu-site.vercel.app            project-finc.onrender.com   schema "finc"
```

O navegador fala **só com a Vercel**. As chamadas a `/api/...` são repassadas pela Vercel ao Render. Esse repasse é feito pela regra `rewrites` do `finc/vercel.json`.

Por que repassar em vez de o site chamar o Render direto: para o navegador, a API fica no mesmo endereço do site. Assim, o cookie de login funciona em todos os navegadores, inclusive no Safari e no iPhone, que bloqueiam cookies de outro domínio. Também não é preciso configurar CORS.

## Antes de começar: quando mexer nos painéis

A Vercel e o Render publicam a branch `main`. A FINC 2.0 está na branch `claude/finc-reverse-engineering-q5jp2l` e ainda não está na `main`.

Se você mudar as configurações (pasta `finc`, comandos) **antes** do merge, os próximos deploys da `main` vão falhar, porque a pasta `finc` ainda não existe lá.

Por isso, faça **na mesma hora**:

1. Ajuste a Vercel (seção 3) e o Render (seção 2).
2. Faça o merge da branch na `main`.
3. Se algum deploy não começar sozinho, clique em **Redeploy** (Vercel) ou **Manual Deploy › Deploy latest commit** (Render).

Para validar antes do merge, rode tudo localmente (seção 4). Se quiser testar o Render antes, troque temporariamente a **Branch** do serviço para `claude/finc-reverse-engineering-q5jp2l`. Enquanto isso, o site antigo da Vercel deixa de funcionar com a API.

---

## 1. Supabase (banco de dados)

Na FINC 2.0, o Supabase é usado **só como PostgreSQL**. O back-end se conecta direto ao banco, pela `DATABASE_URL`. Isso significa que:

- **não** se usam `SUPABASE_URL`, `anon key` nem `service_role key`;
- **não** se usa o Supabase Auth: o login é da própria FINC.

### 1.1. Pegar a connection string

1. Abra https://supabase.com/dashboard e entre no projeto `bionwcsdrmmtxueypbbt`.
2. Clique em **Connect**, no topo da página.
3. Em **Connection String**, escolha **Session pooler**. Ele usa a porta `5432`.
   - **Não** use a **Direct connection** (`db.bionwcsdrmmtxueypbbt.supabase.co`): ela só funciona por IPv6, e o Render não tem IPv6.
4. Copie a string. Ela tem este formato (a região e o prefixo `aws-0` ou `aws-1` aparecem na sua tela):
   ```
   postgresql://postgres.bionwcsdrmmtxueypbbt:[YOUR-PASSWORD]@aws-0-REGIAO.pooler.supabase.com:5432/postgres
   ```
5. Troque `[YOUR-PASSWORD]` pela senha do banco, **sem os colchetes**.
   - Se não lembrar a senha, gere outra em **Project Settings › Database › Reset database password**. O back-end antigo não usa essa senha (ele usa a URL e a chave do Supabase), então trocá-la não o afeta.
   - Prefira uma senha só com letras e números. Se ela tiver caracteres especiais, codifique-os: `@` vira `%40`, `#` vira `%23`, `/` vira `%2F`, `?` vira `%3F` e `%` vira `%25`.

Essa string é a **`DATABASE_URL`** do Render (seção 2). Ela é secreta: não a coloque no código nem no GitHub.

### 1.2. Schema `finc`: separação das tabelas antigas

O projeto do Supabase já tem as tabelas da versão antiga em `public` (`clientes`, `produtos`, `planos`…). Com `DATABASE_SCHEMA=finc`, a FINC 2.0:

- cria um schema próprio, chamado `finc`, com as tabelas novas;
- **não altera nem apaga nada** em `public`.

Isso traz duas vantagens:

- A versão antiga continua funcionando até o merge.
- Os dados ficam protegidos. O Supabase publica automaticamente pela internet as tabelas de `public` (a "Data API", acessível com a `anon key`). O schema `finc` não é publicado, então senhas (cifradas), sessões e notas ficam acessíveis só pelo back-end.

Para conferir, depois do primeiro deploy, abra **Table Editor** no Supabase e escolha o schema **`finc`** no seletor do topo. As tabelas novas devem estar lá.

### 1.3. SSL

Use `DATABASE_SSL=no-verify`. A conexão fica cifrada, mas o certificado não é conferido.

Esse ajuste é necessário porque o Supabase usa uma autoridade certificadora própria. Sem ele, o driver acusa `self-signed certificate in certificate chain`.

Para validar também o certificado:

1. No Supabase, abra **Project Settings › Database › SSL Configuration › Download certificate**.
2. No Render, defina `DATABASE_SSL=verify`.
3. Em `DATABASE_SSL_CA`, cole o conteúdo do arquivo baixado, da linha `-----BEGIN CERTIFICATE-----` até a linha `-----END CERTIFICATE-----`.

---

## 2. Render (back-end)

Abra https://dashboard.render.com e entre no serviço **`srv-d55d3vfgi27c73eik5ng`** (project-finc).

### 2.1. Settings › Build & Deploy

| Campo | Valor |
|---|---|
| **Branch** | `main` (ou a branch da FINC 2.0, só para testar antes do merge) |
| **Root Directory** | `finc` |
| **Runtime** | Node |
| **Build Command** | `npm ci --include=dev && npm run build -w @finc/shared && npm run build -w @finc/api` |
| **Start Command** | `npm start` |
| **Health Check Path** (em *Health & Alerts*) | `/api/health` |

O `--include=dev` é obrigatório. Com `NODE_ENV=production`, o npm pularia as ferramentas de build (TypeScript, tsup), e o build falharia.

### 2.2. Environment (variáveis de ambiente)

Em **Environment › Environment Variables**, cadastre:

| Variável | Valor | Obrigatória |
|---|---|---|
| `NODE_VERSION` | `22` | Sim |
| `NODE_ENV` | `production` | Sim |
| `SERVE_WEB` | `false` | Sim. O site fica na Vercel |
| `APP_URL` | O endereço do site na Vercel, ex.: `https://finc.vercel.app`, **sem barra no final** | Sim. É usado nos links dos e-mails (redefinição de senha) |
| `TRUST_PROXY` | `true` | Sim. As requisições passam pela Vercel e pelo Render, e a Vercel informa o IP real do visitante, usado no limite de tentativas |
| `SESSION_SECRET` | Texto aleatório com 32 caracteres ou mais | Sim. Gere com `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`. Se mudar, todos os usuários são desconectados |
| `DATABASE_URL` | String do Supabase (seção 1.1) | Sim |
| `DATABASE_SCHEMA` | `finc` | Sim (seção 1.2) |
| `DATABASE_SSL` | `no-verify` | Sim (seção 1.3) |
| `DATABASE_SSL_CA` | Conteúdo do certificado do Supabase | Só com `DATABASE_SSL=verify` |
| `CERT_ENCRYPTION_KEY` | 32 bytes em base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | Para usar o certificado A1. **Guarde essa chave**: se ela se perder, os certificados salvos ficam ilegíveis |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Do seu provedor de e-mail (Gmail com senha de app, Brevo, SES…) | Recomendadas. Sem elas, ninguém recupera a senha nem envia documentos ao contador. Veja [integracoes.md](integracoes.md) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` | Do bot | Opcionais (suporte) |
| `ADMIN_EMAILS` | Seu e-mail | Opcional. Quem se cadastrar com esse e-mail vira administrador do suporte |
| `LOG_LEVEL` | `info` | Opcional |

Algumas variáveis **não devem** ser definidas:

- **`PORT`:** o Render escolhe a porta.
- **`CORS_ORIGINS`:** não é necessária, porque a Vercel repassa as chamadas.

As variáveis antigas (`SUPABASE_URL`, `SUPABASE_KEY` etc.) só servem para o back-end antigo. Apague-as **depois** do merge.

A explicação de todas as variáveis, uma a uma, está em [configuracao.md](configuracao.md).

### 2.3. Teste

Abra https://project-finc.onrender.com/api/health. A resposta esperada é:

```json
{"status":"ok","versao":"2.0.0","banco":{"ok":true,"tipo":"pg"}, ...}
```

Se aparecer erro, consulte a aba **Logs** e a tabela "Problemas comuns" no fim deste guia.

---

## 3. Vercel (front-end)

Em https://vercel.com, abra o projeto conectado ao repositório e vá em **Settings**.

### 3.1. Settings › Build and Deployment

| Campo | Valor |
|---|---|
| **Root Directory** | `finc`. **Não** use `finc/apps/web`: o site depende do pacote `packages/shared`, que fica em `finc` |
| **Framework Preset** | `Other` |
| **Build / Output / Install Command** | Deixe os campos **sem override** (desligados). Os comandos já estão no `finc/vercel.json`: build `npm run build -w @finc/shared && npm run build -w @finc/web`, saída `apps/web/dist`, instalação `npm ci` |
| **Node.js Version** | `22.x` |

### 3.2. Variáveis de ambiente

**Nenhuma é necessária.** O endereço do back-end está no `finc/vercel.json`:

```json
{ "source": "/api/:path*", "destination": "https://project-finc.onrender.com/api/:path*" }
```

Se o endereço do Render mudar, por exemplo para um domínio próprio, altere essa linha e faça um commit. Na Vercel não há segredos: tudo o que é sensível fica no Render.

Se o projeto antigo tinha variáveis como `REACT_APP_API_URL` ou `REACT_APP_SUPABASE_*`, elas não são mais usadas e podem ser apagadas depois do merge.

### 3.3. Teste

1. Abra o site da Vercel e acesse `/api/health`. Deve aparecer o mesmo JSON do Render, o que prova que o repasse funciona.
2. Crie uma conta e faça login.
3. Atualize o `APP_URL` no Render com o domínio final da Vercel.

### 3.4. Administrador do suporte

Libera o menu *Administração › Chamados*. O jeito mais simples é definir `ADMIN_EMAILS` no Render com o seu e-mail e se cadastrar com ele. Outra opção: no Supabase, abra **SQL Editor** e rode:

```sql
UPDATE finc.usuarios SET papel = 'admin' WHERE email = 'seu@email.com';
```

---

## 4. Rodar localmente

Todos os comandos são rodados dentro da pasta `finc`.

### Front-end e back-end locais (recomendado para desenvolver)

```bash
npm run dev              # Git Bash, WSL, Linux ou macOS
```

No PowerShell, abra dois terminais:

```powershell
npm run dev -w @finc/api   # terminal 1: API em http://localhost:3333 (banco local, sem Supabase)
npm run dev -w @finc/web   # terminal 2: site em http://localhost:5173
```

### Só o front-end local, usando o back-end do Render

Esta opção só funciona depois que o Render estiver rodando a FINC 2.0 (seção 2). O back-end antigo não entende as rotas novas.

1. Crie o arquivo `finc/apps/web/.env.local`. Ele não vai para o Git.
   ```
   VITE_API_PROXY=https://project-finc.onrender.com
   ```
2. Rode:
   ```bash
   npm run dev -w @finc/web
   ```
3. Abra http://localhost:5173.
4. Para voltar a usar a API local, apague o `.env.local`.

Isso funciona no Chrome, no Edge e no Firefox. O Safari não aceita, em `http://localhost`, os cookies seguros que o Render envia.

### Back-end local usando o Supabase

Útil para conferir a conexão antes de mexer no Render. No `finc/.env`:

```
DATABASE_URL=postgresql://postgres.bionwcsdrmmtxueypbbt:SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres
DATABASE_SCHEMA=finc
DATABASE_SSL=no-verify
```

**Atenção:** com essa configuração, os testes locais gravam no banco de produção.

---

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `self-signed certificate in certificate chain` (Render) | Faltou `DATABASE_SSL=no-verify` |
| `ENETUNREACH` ou `ETIMEDOUT` com `db.bionwcsdrmmtxueypbbt.supabase.co` | Você usou a Direct connection. Use a string do **Session pooler** |
| `password authentication failed` | Senha errada, ou caracteres especiais sem codificação na URL |
| `Tenant or user not found` | O usuário precisa ser `postgres.bionwcsdrmmtxueypbbt`, não só `postgres` |
| `relation "planos" already exists` | Faltou `DATABASE_SCHEMA=finc`, e a FINC tentou criar as tabelas em `public`, onde estão as antigas |
| Erro do `tsup` ou `tsc` no build do Render | O Build Command precisa ter `--include=dev` |
| Build da Vercel procurando `Front-End` ou `react-scripts` | A Root Directory ainda aponta para a pasta antiga. Mude para `finc` |
| `/api/...` na Vercel devolve a página do site | O `vercel.json` não foi lido. Confira se a Root Directory é `finc` |
| Login funciona, mas as ações dão "Falha na validação de segurança (CSRF)" | O site está chamando o Render direto, e não pela Vercel. Use sempre o endereço da Vercel |
| A primeira abertura demora cerca de 1 minuto ou dá erro 504 | O plano gratuito do Render desliga a API após 15 minutos sem uso e a religa no próximo acesso. Aguarde e recarregue a página. O plano gratuito do Supabase pausa o projeto após uma semana sem uso; nesse caso, reative-o no painel |
