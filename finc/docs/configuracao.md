# Configuração completa: variáveis de ambiente

Toda a configuração da FINC é feita por variáveis de ambiente.

- **Onde ficam:** no arquivo `.env`, na raiz do projeto (pasta `finc/`).
- **Como criar:** o `scripts/install.sh` gera o `.env` com segredos aleatórios. Para fazer à mão: `cp .env.example .env` e depois `chmod 600 .env`.
- **Variáveis do sistema têm prioridade:** se a mesma variável estiver definida no sistema (`export VAR=...`, painel do provedor de hospedagem, `environment:` do Docker), esse valor vence o do `.env`.
- **Validação na partida:** a API valida tudo ao iniciar. Se algo estiver errado, ela **não sobe** e lista todos os problemas de uma vez, por exemplo:
  ```
  Configuração inválida:
   - SESSION_SECRET é obrigatório em produção
   - Em produção use PostgreSQL (DATABASE_URL=postgres://...)
  ```
- **Nunca** versione o `.env` (ele já está no `.gitignore`). Para conferir que não há segredos no projeto, rode `bash scripts/check-secrets.sh`.

---

## 1. Servidor

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `NODE_ENV` | `development` | Sim, em produção | Valores: `development`, `test` ou `production`. Em `production` acontece o seguinte: os cookies passam a ser `Secure`, HSTS e `upgrade-insecure-requests` são ativados, `SESSION_SECRET` vira obrigatório, PGlite e `RATE_LIMIT_DESATIVADO=true` são recusados, e o link de redefinição de senha nunca é gravado no log |
| `PORT` | `3333` | Não | Porta HTTP da API. Com `SERVE_WEB=true`, também é a porta do site |
| `HOST` | `0.0.0.0` | Não | Interface de escuta. Use `127.0.0.1` quando houver um proxy reverso na mesma máquina |
| `APP_URL` | `http://localhost:5173` | Recomendada | Endereço público do site, **sem barra no final**. Usado nos links dos e-mails (redefinição de senha, notificações) e como origem liberada no CORS. Em produção: `https://finc.seudominio.com.br`. No Render, se ficar vazia, a FINC usa a `RENDER_EXTERNAL_URL` que o próprio Render fornece |
| `SERVE_WEB` | `false` | Sim, em produção | `true` faz a API entregar o site compilado (`apps/web/dist`) na mesma origem. É a configuração recomendada: cookies `SameSite=Lax` e CSRF funcionam sem ajustes |
| `WEB_DIST_DIR` | vazio | Não | Caminho alternativo do build do site. Vazio significa `apps/web/dist` |
| `TRUST_PROXY` | `loopback` | Atrás de proxy | Diz ao Express quem é o proxy, para ele usar o IP real do cliente (rate limit e auditoria). Valores: `true` (confia em qualquer proxy; use só se a API **não** estiver exposta diretamente), `false`, `loopback` (proxy na mesma máquina) ou um número de saltos, como `1` |
| `LOG_LEVEL` | `info` | Não | `fatal`, `error`, `warn`, `info`, `debug`, `trace` ou `silent`. Os logs saem em JSON (pino), com cookies, CSRF, senhas e tokens redigidos |

## 2. Banco de dados

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `DATABASE_URL` | `pglite://./.data/pglite` | Sim | Conexão com o banco (formatos abaixo) |
| `MIGRATIONS_DIR` | vazio | Não | Pasta alternativa das migrações. Vazio significa `db/migrations` |
| `DATABASE_SSL` | vazio | Em bancos gerenciados | Criptografia da conexão com o PostgreSQL. Vazio: segue o `sslmode` da URL. `no-verify`: conexão cifrada sem validar o certificado (use no **Supabase**, cuja CA própria faz o `sslmode=require` falhar com `self-signed certificate`). `verify`: cifra e valida o certificado (informe `DATABASE_SSL_CA` se a CA não for pública). `false`: sem SSL. Quando definida, prevalece sobre o `sslmode` da URL |
| `DATABASE_SCHEMA` | vazio | No Supabase | Schema onde ficam as tabelas da FINC. Vazio: `public`. Use `finc` no Supabase: separa as tabelas da versão antiga e as deixa fora da Data API pública do Supabase. O schema é criado automaticamente |
| `DATABASE_SSL_CA` | vazio | Não | Só com `DATABASE_SSL=verify`. Certificado da CA em PEM: o conteúdo (`-----BEGIN CERTIFICATE-----...`) ou o caminho do arquivo. No Supabase: *Project Settings › Database › SSL Configuration › Download certificate* |

Formatos aceitos em `DATABASE_URL`:

| Formato | Quando usar |
|---|---|
| `pglite://./.data/pglite` | **Desenvolvimento.** PostgreSQL embarcado, gravado em disco. O caminho é relativo à pasta do `.env`. Não exige instalar nada |
| `pglite://memory` | Testes. Banco em memória, apagado ao encerrar |
| `postgres://usuario:senha@host:5432/banco` | **Produção** (PostgreSQL 13 ou superior). Para SSL gerenciado, acrescente `?sslmode=require` ou use `DATABASE_SSL`. Caracteres especiais na senha (`@`, `#`, `/`, `?`, `%`) precisam ser codificados: `@` vira `%40`, `#` vira `%23` |

**Vercel + Render + Supabase:** veja o passo a passo em [deploy-vercel-render-supabase.md](deploy-vercel-render-supabase.md).

As migrações são aplicadas automaticamente quando a API inicia. Também podem ser aplicadas manualmente com `npm run migrate`.

## 3. Sessão e segurança

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `SESSION_SECRET` | vazio | Sim, em produção | Segredo que assina os tokens CSRF. Precisa ter **32 caracteres ou mais**; gere com `openssl rand -base64 48`. Trocar o valor invalida as abas abertas (o usuário só precisa recarregar a página). Em desenvolvimento, se ficar vazio, é gerado um segredo temporário a cada reinício |
| `SESSION_TTL_HORAS` | `8` | Não | Duração da sessão, de 1 a 720 horas. Depois disso o usuário precisa entrar de novo |
| `COOKIE_SECURE` | vazio (automático) | Não | Vazio = `Secure` ligado em produção e desligado em desenvolvimento. `true` força o ligado (HTTPS com `NODE_ENV` diferente de production). `false` desliga: use **só** para testar em rede local sem HTTPS, porque sem isso o navegador recusa o cookie e o login não funciona |
| `CORS_ORIGINS` | vazio | Não | Origens extras liberadas, separadas por vírgula. Só é necessário quando o site está em **outro subdomínio do mesmo domínio** (ex.: site em `app.empresa.com`, API em `api.empresa.com`). Domínios de sites diferentes não são suportados (o cookie é `SameSite=Lax`) |
| `RATE_LIMIT_DESATIVADO` | `false` | Não | `true` desliga o limite de requisições. Uso **exclusivo em testes automatizados**. A API se recusa a iniciar em produção com `true` |

Limites de requisição que ficam ativos com `RATE_LIMIT_DESATIVADO=false` (todos por IP):

| Ação | Limite |
|---|---|
| Geral | 1000 a cada 15 min |
| Login | 10 tentativas com falha a cada 15 min |
| Cadastro | 10 por hora |
| Recuperação ou troca de senha | 5 por hora |
| Escrita | 300 a cada 15 min |

Além disso, a conta fica bloqueada por 15 minutos após 5 senhas erradas seguidas.

## 4. Certificado digital A1

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `CERT_ENCRYPTION_KEY` | vazio | Para usar certificado | Chave AES-256 (exatamente 32 bytes em base64). Gere com `openssl rand -base64 32`. Vazio = a tela **Notas fiscais › Certificado digital** informa que o recurso está desativado |

> ⚠️ **Faça backup desta chave** junto com o backup do banco. Se a chave for perdida ou trocada, os certificados já salvos não poderão ser lidos, e cada usuário terá de enviar o seu de novo. A API recusa iniciar se a chave não tiver 32 bytes.

## 5. E-mail (SMTP)

O e-mail é usado para quatro coisas:

- redefinição de senha;
- notificações por e-mail (opção do usuário);
- envio de PDF e XML ao contador;
- e-mail de teste.

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `SMTP_HOST` | vazio | Para usar e-mail | Servidor SMTP. **Vazio = e-mail desligado** |
| `SMTP_PORT` | `587` | Não | `587` (STARTTLS) ou `465` (TLS direto) |
| `SMTP_SECURE` | `false` | Não | `true` para a porta 465 e `false` para a 587 |
| `SMTP_USER` | vazio | Depende do provedor | Usuário SMTP |
| `SMTP_PASS` | vazio | Depende do provedor | Senha ou chave SMTP. Em contas com verificação em 2 etapas, use uma "senha de app" |
| `SMTP_FROM` | vazio | Para usar e-mail | Remetente, ex.: `"FINC <nao-responda@empresa.com.br>"`. O domínio deve estar autorizado (SPF/DKIM) no provedor |

Exemplos:

| Provedor | Configuração |
|---|---|
| Google Workspace / Gmail | `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER=sua-conta@gmail.com`, `SMTP_PASS=<senha de app>` |
| Amazon SES | `SMTP_HOST=email-smtp.sa-east-1.amazonaws.com`, `SMTP_PORT=587`, com usuário e senha SMTP gerados no console do SES |
| Brevo, Mailgun, SendGrid | Use o host, a porta e as credenciais SMTP indicados no painel do provedor |

Para testar: entre na FINC, abra **Menu da conta › Notificações** e clique em **Enviar teste**.

> Sem SMTP em **desenvolvimento**, o link de redefinição de senha aparece no log da API. Procure por `SMTP não configurado — link de redefinição`.

## 6. Telegram (equipe de suporte)

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | vazio | Para usar o bot | Token do bot, criado no @BotFather |
| `TELEGRAM_CHAT_ID` | vazio | Para usar o bot | ID do grupo ou chat da equipe. Grupos começam com `-100…`. A FINC só aceita comandos vindos desse chat |
| `TELEGRAM_WEBHOOK_SECRET` | vazio | Para responder pelo bot | Segredo do webhook. Gere com `openssl rand -hex 24` |

Passo a passo completo (criar o bot, descobrir o chat e registrar o webhook): [integracoes.md](integracoes.md#2-telegram-equipe-de-suporte). Sem Telegram, a equipe responde pelo painel web em **Menu da conta › Chamados (equipe)**. Esse menu aparece para quem foi promovido a admin.

## 7. Consulta de CEP

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `VIACEP_URL` | `https://viacep.com.br/ws` | Não | Serviço de CEP consultado pelo servidor. O servidor precisa ter acesso de saída a esse endereço; se não tiver, o usuário preenche o endereço à mão |

## 8. Docker Compose

Estas variáveis são lidas **somente** pelo `docker-compose.yml`:

| Variável | Padrão | Obrigatória | O que faz |
|---|---|---|---|
| `POSTGRES_PASSWORD` | vazio | Sim | Senha do PostgreSQL do container. O compose monta `DATABASE_URL` sozinho a partir dela. O `install.sh` gera um valor aleatório |
| `FINC_PORT` | `3333` | Não | Porta publicada no servidor (host) |

No compose, `NODE_ENV=production`, `SERVE_WEB=true` e `DATABASE_URL` são definidos pelo próprio arquivo e **sobrescrevem** o `.env`. As demais variáveis (`SESSION_SECRET`, `APP_URL`, SMTP etc.) vêm do `.env`.

## 9. Front-end (Vite)

Estas variáveis valem no **build** ou no `npm run dev` do site. Defina-as em `apps/web/.env.local` ou exporte antes do comando:

| Variável | Padrão | O que faz |
|---|---|---|
| `VITE_API_URL` | vazio | URL da API, quando o site for hospedado separado dela. Vazio = mesma origem (recomendado) |
| `VITE_API_PROXY` | `http://localhost:3333` | Para onde o `npm run dev` (Vite) encaminha as chamadas `/api`. Pode ficar em `apps/web/.env.local` (modelo em `apps/web/.env.example`). Ex.: `https://project-finc.onrender.com` para usar o back-end do Render |

## 10. Testes

| Variável | O que faz |
|---|---|
| `TEST_DATABASE_URL` | Roda os testes da API contra um PostgreSQL real. Cada arquivo de teste cria e apaga o próprio banco, então o usuário precisa poder executar `CREATE DATABASE`. Exemplo: `TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres npm test -w @finc/api` |
| `E2E_BASE_URL` | Roda o Playwright contra uma instância já em execução (ex.: o container de produção) |
| `E2E_PORT` | Porta da instância que o Playwright sobe sozinho (padrão `3399`) |

Variáveis internas, que você normalmente não define:

- `FINC_ROOT`: preenchida automaticamente com a pasta do `.env`, para resolver caminhos relativos do PGlite;
- `STUB_PORT` e `STUB_HOST`: usadas pelo stub de CEP dos testes E2E.

---

## Receitas por cenário

### A) Desenvolvimento na sua máquina

```env
NODE_ENV=development
APP_URL=http://localhost:5173
DATABASE_URL=pglite://./.data/pglite
SERVE_WEB=false
```

Rode `npm run dev`. O site abre em http://localhost:5173 e a API em http://localhost:3333.

### B) Servidor Linux com Docker (recomendado para produção)

```env
SESSION_SECRET=<openssl rand -base64 48>
CERT_ENCRYPTION_KEY=<openssl rand -base64 32>
POSTGRES_PASSWORD=<openssl rand -hex 16>
APP_URL=https://finc.suaempresa.com.br
TRUST_PROXY=loopback
FINC_PORT=3333
# + SMTP_* e TELEGRAM_* se for usar
```

Suba com `docker compose up -d --build` e coloque um proxy HTTPS na frente (Caddy, nginx ou Traefik) apontando para `127.0.0.1:3333`. Exemplo com Caddy, que emite o certificado HTTPS automaticamente:

```
finc.suaempresa.com.br {
  reverse_proxy 127.0.0.1:3333
}
```

### C) Servidor Linux com Node.js e PostgreSQL próprio

```env
NODE_ENV=production
PORT=3333
HOST=127.0.0.1
SERVE_WEB=true
APP_URL=https://finc.suaempresa.com.br
DATABASE_URL=postgres://finc:SENHA@localhost:5432/finc
SESSION_SECRET=<openssl rand -base64 48>
CERT_ENCRYPTION_KEY=<openssl rand -base64 32>
TRUST_PROXY=loopback
```

Rode `bash scripts/prod.sh`. Para manter o serviço ativo, use systemd, por exemplo em `/etc/systemd/system/finc.service`:

```ini
[Unit]
Description=FINC
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/finc
EnvironmentFile=/opt/finc/.env
Environment=NODE_ENV=production SERVE_WEB=true
ExecStartPre=/usr/bin/node apps/api/dist/db/migrate-cli.js
ExecStart=/usr/bin/node apps/api/dist/server.js
Restart=always
User=finc

[Install]
WantedBy=multi-user.target
```

Antes de iniciar o serviço, gere o build uma vez com `npm ci && npm run build`. Depois:

```bash
sudo systemctl enable --now finc
```

### D) Teste rápido na rede local, sem HTTPS (não use em produção)

```env
NODE_ENV=production
COOKIE_SECURE=false
APP_URL=http://192.168.0.10:3333
```

## Checklist antes de colocar no ar

- [ ] `NODE_ENV=production`, `SERVE_WEB=true` e `APP_URL` com o endereço HTTPS público.
- [ ] `DATABASE_URL` apontando para o PostgreSQL, com backup diário (`pg_dump`).
- [ ] `SESSION_SECRET` com 32 caracteres ou mais, aleatório.
- [ ] `CERT_ENCRYPTION_KEY` gerada **e guardada em local seguro**.
- [ ] HTTPS ativo no proxy, com `TRUST_PROXY` ajustado.
- [ ] SMTP configurado e testado (sem ele, ninguém consegue recuperar a senha).
- [ ] Admin do suporte promovido (`npm run admin:promover -w @finc/api -- email`; no Docker: `docker compose exec app node apps/api/dist/scripts/promover-admin.js email`).
- [ ] `bash scripts/check-secrets.sh` sem alertas no código publicado.
- [ ] `curl https://finc.suaempresa.com.br/api/health` respondendo `"status":"ok"` e mostrando as integrações esperadas como `true`.
