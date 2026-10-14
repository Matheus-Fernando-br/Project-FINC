# Publicar a FINC 2.0 no Render com banco no Supabase

Este guia coloca a FINC no ar usando:

- **Supabase** como banco de dados PostgreSQL;
- **Render** para rodar a aplicação. Um único serviço entrega a API e o site no mesmo endereço.

## O que mudou em relação à versão antiga

| Versão antiga | FINC 2.0 |
|---|---|
| Front-end na Vercel e back-end no Render, em domínios diferentes | Um único serviço no Render entrega a API (`/api`) e o site. A Vercel não é mais necessária |
| Supabase usado pelo SDK (`SUPABASE_URL` e chave) e pelo Supabase Auth | O Supabase é usado **só como PostgreSQL**, pela `DATABASE_URL`. Login, senhas e sessões são da própria FINC |
| Tabelas criadas à mão no painel | As tabelas são criadas pelas migrações (`finc/db/migrations`) quando a aplicação inicia |

Por isso, as variáveis antigas (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_ANON_KEY` etc.) **não são usadas** e podem ser apagadas.

## 1. Supabase: criar o banco

### 1.1. Use um projeto novo

O projeto antigo já tem tabelas com os mesmos nomes (`clientes`, `produtos`, `servicos`, `contadores`, `planos`, `chamados`), mas com outra estrutura. Se você apontar a FINC 2.0 para ele, a migração falha com `relation "planos" already exists`.

Os usuários do Supabase Auth também não passam para a nova versão, porque as senhas ficam guardadas no Auth do Supabase. Cada pessoa precisa criar a conta de novo.

1. Em https://supabase.com/dashboard, clique em **New project**.
2. Dê um nome (ex.: `finc-2`) e **crie uma senha forte para o banco. Anote essa senha.** Prefira uma senha só com letras e números, para não precisar codificar caracteres especiais na URL.
3. Em **Region**, escolha **East US (North Virginia)**, a mesma região do Render no `render.yaml`. Assim a resposta é mais rápida. Se preferir manter os dados no Brasil, escolha **South America (São Paulo)**: funciona, mas cada consulta fica mais lenta, porque o Render não tem servidores no Brasil.
4. Mantenha o projeto antigo como está, para consulta ou backup.

### 1.2. Copiar a connection string

1. No projeto novo, clique em **Connect**, no topo da página.
2. Na aba de connection string, escolha **Session pooler**. Ele usa a porta `5432`.
   - Não use a **Direct connection**: ela só funciona por IPv6, e o Render não tem IPv6. O resultado seria `ENETUNREACH`.
   - O **Transaction pooler** (porta `6543`) também funciona, mas o Session pooler é o recomendado para um servidor que fica ligado o tempo todo.
3. A string tem este formato:
   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
4. Troque `[YOUR-PASSWORD]` pela senha do passo 1.1, **sem os colchetes**.
   - Se a senha tiver caracteres especiais, codifique-os: `@` vira `%40`, `#` vira `%23`, `/` vira `%2F`, `?` vira `%3F` e `%` vira `%25`.

Essa é a sua `DATABASE_URL`. Não coloque essa string no código nem no GitHub: ela vai só no painel do Render.

### 1.3. SSL

A conexão usa `DATABASE_SSL=no-verify`, que já vem no `render.yaml`. Com essa opção, a conexão é cifrada, mas o certificado não é conferido.

Esse ajuste é necessário porque o Supabase assina os certificados com uma CA própria. Com o `sslmode=require` puro, o driver tenta validar o certificado e a conexão falha com `self-signed certificate in certificate chain`.

Para validar também o certificado:

1. No Supabase, abra **Project Settings › Database › SSL Configuration › Download certificate**.
2. No Render, defina `DATABASE_SSL=verify`.
3. Em `DATABASE_SSL_CA`, cole o conteúdo do arquivo baixado, da linha `-----BEGIN CERTIFICATE-----` até a linha `-----END CERTIFICATE-----`.

## 2. Render: criar o serviço

Escolha **um** dos dois caminhos.

### Caminho A: Blueprint (cria tudo pelo `render.yaml`)

1. Em https://dashboard.render.com, clique em **New › Blueprint**.
2. Selecione o repositório `Project-FINC` e a branch `claude/finc-reverse-engineering-q5jp2l`. O Render lê o `render.yaml` da raiz.
3. O Render pede os valores marcados como secretos:
   - **`DATABASE_URL`:** a string do passo 1.2.
   - **`CERT_ENCRYPTION_KEY`:** só é necessária para guardar o certificado A1. Gere no seu computador com `openssl rand -base64 32` (no Git Bash ou no WSL) ou com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. **Guarde essa chave**: se ela se perder, os certificados salvos ficam ilegíveis. Pode deixar em branco e preencher depois.
4. Clique em **Apply**. O `SESSION_SECRET` é gerado automaticamente.

### Caminho B: reaproveitar o serviço antigo (mantém o mesmo endereço `.onrender.com`)

No serviço antigo do back-end, abra **Settings** e ajuste:

| Campo | Valor |
|---|---|
| **Branch** | `claude/finc-reverse-engineering-q5jp2l` |
| **Root Directory** | `finc` |
| **Runtime** | Node |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** (em *Health & Alerts*) | `/api/health` |

Depois, em **Environment**, apague as variáveis antigas do Supabase e cadastre as variáveis da tabela abaixo.

## 3. Variáveis de ambiente no Render

| Variável | Valor | Observação |
|---|---|---|
| `NODE_VERSION` | `22` | A FINC exige Node 22.12 ou superior |
| `NODE_ENV` | `production` | |
| `SERVE_WEB` | `true` | O serviço entrega o site e a API |
| `TRUST_PROXY` | `1` | O Render fica na frente da aplicação. Esse valor permite usar o IP real do visitante no limite de tentativas |
| `SESSION_SECRET` | Gerado (Blueprint) ou `openssl rand -base64 48` | Mínimo de 32 caracteres. Se mudar, todos os usuários são desconectados |
| `DATABASE_URL` | String do Supabase (passo 1.2) | Secreta |
| `DATABASE_SSL` | `no-verify` | Ou `verify` + `DATABASE_SSL_CA` (passo 1.3) |
| `CERT_ENCRYPTION_KEY` | `openssl rand -base64 32` | Opcional. Necessária para o certificado A1 |
| `APP_URL` | Não precisa | Se ficar vazia, a FINC usa a `RENDER_EXTERNAL_URL` que o Render fornece (ex.: `https://finc.onrender.com`). Defina só se usar um domínio próprio |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Do seu provedor de e-mail | Recomendadas. Sem elas, ninguém consegue recuperar a senha nem enviar documentos ao contador. Veja [integracoes.md](integracoes.md) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` | Do bot | Opcionais. Usadas pelo suporte |

**Não defina `PORT`.** O Render escolhe a porta, e a FINC usa o valor que ele informa.

A lista completa de variáveis, uma a uma, está em [configuracao.md](configuracao.md).

## 4. Primeiro deploy e teste

1. Acompanhe a aba **Logs**. O build leva alguns minutos.
2. Quando o deploy terminar, as tabelas são criadas automaticamente no Supabase. Para conferir, abra **Table Editor** no Supabase: devem aparecer `usuarios`, `clientes`, `notas` etc.
3. Abra `https://SEU-SERVICO.onrender.com/api/health`. A resposta esperada é:
   ```json
   {"status":"ok", "banco":{"ok":true,"tipo":"pg"}, ...}
   ```
4. Abra `https://SEU-SERVICO.onrender.com`, crie a sua conta e use a plataforma.

### Tornar-se administrador do suporte

Libera o menu *Administração › Chamados*.

No Supabase, abra **SQL Editor** e rode:

```sql
UPDATE usuarios SET papel = 'admin' WHERE email = 'seu@email.com';
```

## 5. Desligar o que não é mais usado

- **Vercel:** o site agora é entregue pelo Render. Você pode pausar ou apagar o projeto antigo na Vercel. Se tiver um domínio próprio apontando para a Vercel, aponte-o para o Render (**Settings › Custom Domains**) e defina `APP_URL` com esse domínio.
- **Serviço antigo no Render:** se você usou o Caminho A, o serviço antigo continua rodando a versão antiga. Apague-o quando não precisar mais dele.

## Problemas comuns

| Erro no log | Causa e solução |
|---|---|
| `self-signed certificate in certificate chain` | Defina `DATABASE_SSL=no-verify` ou use `verify` com `DATABASE_SSL_CA` |
| `ENETUNREACH` ou `connect ETIMEDOUT` com `db.xxxx.supabase.co` | Você usou a Direct connection, que só tem IPv6. Use a string do **Session pooler** |
| `password authentication failed` | Senha errada, ou caracteres especiais sem codificação na URL (passo 1.2) |
| `Tenant or user not found` | O usuário precisa ter o formato `postgres.REF_DO_PROJETO`, como aparece na string do pooler |
| `relation "planos" already exists` | Você apontou para o projeto antigo do Supabase. Use um projeto novo (passo 1.1) |
| `Configuração inválida: SESSION_SECRET é obrigatório em produção` | Defina `SESSION_SECRET` |
| `Cannot find module` ou erro do `tsup`/`vite` no build | O Build Command precisa ter `--include=dev`: `npm ci --include=dev && npm run build` |
| O site demora cerca de 1 minuto para abrir | No plano gratuito, o Render desliga o serviço após 15 minutos sem acesso e o religa no próximo acesso. No plano gratuito do Supabase, o projeto é pausado após uma semana sem uso; nesse caso, reative-o no painel |
