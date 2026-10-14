# Integrações externas

Todas as integrações são **opcionais** e ficam **desligadas** enquanto as credenciais não forem configuradas no `.env`. Integração desligada nunca aparece na interface como se estivesse funcionando:

- os botões que dependem dela explicam o motivo;
- a API responde `503 INTEGRACAO_NAO_CONFIGURADA`;
- a tela **Configurações › Integrações** mostra a situação real de cada uma (lida de `/api/health`).

| Integração | Status na FINC 2.0 | Variáveis |
|---|---|---|
| E-mail (SMTP) | Implementada | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Telegram (suporte) | Implementada | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` |
| Cofre de certificado A1 | Implementado | `CERT_ENCRYPTION_KEY` |
| ViaCEP | Implementada (sem credencial) | `VIACEP_URL` (opcional) |
| Provedor fiscal (SEFAZ/Prefeitura) | **Pendente**: depende de contrato e credenciais | Ver abaixo |
| Gateway de pagamento | **Pendente**: depende de contrato e credenciais | Ver abaixo |

## 1. E-mail (SMTP)

O SMTP é usado para:

- enviar o link de redefinição de senha;
- enviar notificações por e-mail (quando o usuário opta em **Notificações**);
- enviar PDF e XML ao contador;
- enviar o e-mail de teste.

Exemplo com um provedor de envio transacional (Brevo, Mailgun, Amazon SES, Google Workspace etc.):

```env
SMTP_HOST=smtp-relay.exemplo.com
SMTP_PORT=587
SMTP_SECURE=false        # true para a porta 465
SMTP_USER=<usuario-smtp>
SMTP_PASS=<senha-ou-chave-smtp>
SMTP_FROM="FINC <nao-responda@seudominio.com.br>"
APP_URL=https://finc.seudominio.com.br   # usada para montar os links dos e-mails
```

Para conferir: faça login, abra **Configurações › Notificações** e clique em **Enviar teste**.

> Sem SMTP em **desenvolvimento**, o link de redefinição de senha aparece no log da API (`SMTP não configurado — link de redefinição...`). Em produção, o link nunca é registrado no log.

## 2. Telegram (equipe de suporte)

O bot avisa a equipe sobre novos chamados, mensagens e feedbacks, e permite **aceitar**, **responder** e **encerrar** chamados pelos botões inline. A mesma operação também pode ser feita pelo painel web em **Administração › Chamados**.

1. Crie o bot com o [@BotFather](https://t.me/BotFather) e copie o token.
2. Adicione o bot ao grupo da equipe e descubra o `chat_id`. Uma forma é enviar uma mensagem no grupo e consultar `https://api.telegram.org/bot<TOKEN>/getUpdates`.
3. Configure:

   ```env
   TELEGRAM_BOT_TOKEN=123456789:AA...
   TELEGRAM_CHAT_ID=-1001234567890
   TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 24)
   ```

4. Registre o webhook. A URL precisa ser pública e HTTPS:

   ```bash
   curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -d "url=https://finc.seudominio.com.br/api/integracoes/telegram/webhook" \
     -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
   ```

A FINC rejeita atualizações sem o segredo correto (403) e ignora as que vêm de outro chat. O "modo responder" (clicar em **Responder** e digitar a resposta) fica em memória por 15 minutos. Com várias instâncias da API atrás de um balanceador, prefira responder pelo painel web.

## 3. Certificado digital A1 (cofre)

```env
CERT_ENCRYPTION_KEY=$(openssl rand -base64 32)   # 32 bytes em base64
```

- O usuário envia o arquivo `.pfx` ou `.p12` e a senha. A FINC confere que a senha abre o arquivo, que há chave privada, que o certificado está dentro da validade e que o CPF/CNPJ do CN (padrão ICP-Brasil `NOME:DOCUMENTO`) é o mesmo da conta.
- O arquivo e a senha são gravados cifrados (AES-256-GCM). **Guarde a chave com segurança.** Sem ela, os certificados armazenados não podem ser lidos e os usuários precisarão enviá-los de novo.
- O certificado fica pronto para a assinatura e transmissão do item 5. A FINC 2.0 ainda **não** transmite documentos.

## 4. ViaCEP

É a consulta pública de CEP, feita pelo servidor em `GET /api/util/cep/:cep`, com timeout de 6 s. Não precisa de credencial. Se o serviço estiver fora do ar, o usuário vê a mensagem "Serviço de CEP indisponível" e pode preencher o endereço manualmente. Para usar um espelho ou serviço próprio, defina `VIACEP_URL`.

## 5. Provedor fiscal (pendente)

**Situação atual:** os documentos são emitidos em **ambiente de homologação**, numerados, com PDF e XML gerados pela FINC e a marca **"SEM VALOR FISCAL"**. Com a configuração fiscal em ambiente de **produção**, a emissão é bloqueada com `503 INTEGRACAO_NAO_CONFIGURADA`. Assim, nada é apresentado como nota válida sem ser.

Para emitir NF-e, NFC-e e NFS-e com validade é preciso:

1. Contratar um provedor fiscal homologado que exponha uma API REST para NF-e, NFC-e e NFS-e municipal, ou implementar a comunicação SOAP direta com a SEFAZ. A NFS-e varia por município, ou usa o padrão nacional.
2. Usar o certificado A1 do emitente, que já é armazenado pelo cofre do item 3.
3. Implementar um adaptador no ponto de extensão `emitir()` em `apps/api/src/modules/notas.ts`:
   - montar o layout oficial (NF-e 4.00 e equivalentes) a partir do snapshot já gravado (emitente, destinatário, itens com NCM, CFOP, CST e alíquotas, totais e transporte);
   - transmitir, guardar a **chave de acesso**, o **protocolo de autorização** e o **XML autorizado**;
   - fazer o cancelamento por evento (a justificativa de 15 caracteres ou mais já é exigida).
4. Credenciais típicas (dependem do provedor): `FISCAL_PROVIDER`, `FISCAL_API_URL`, `FISCAL_API_TOKEN` e, para a NFC-e, o CSC/ID token.

## 6. Gateway de pagamento (pendente)

**Situação atual:** a troca entre os planos BÁSICO e BLACK é aplicada na hora e registrada em `assinaturas`, sem cobrança. A tela de Planos informa isso ao usuário. A FINC 2.0 **não** coleta dados de cartão. A tela de cartão da versão original era apenas visual e foi removida.

Para cobrar automaticamente:

1. Contrate um gateway com assinaturas recorrentes, como Mercado Pago, Stripe, Pagar.me ou Asaas.
2. Crie os planos no gateway e redirecione o usuário para o checkout hospedado. Assim, os dados de cartão não passam pela FINC (escopo PCI reduzido).
3. Receba o webhook de pagamento aprovado e só então altere `usuarios.plano_id` e registre a nova linha em `assinaturas`. O ponto de extensão é `assinaturaRoutes` em `apps/api/src/modules/conta.ts`.
4. Credenciais típicas: `PAYMENT_PROVIDER`, `PAYMENT_ACCESS_TOKEN`, `PAYMENT_WEBHOOK_SECRET`.

## 7. Integrações citadas na FINC original e não implementadas

O FAQ da FINC original afirmava ter "integração com e-commerces" e "acesso exclusivo para contadores". Nenhuma das duas existia no código. Na FINC 2.0:

- o contador recebe os documentos por e-mail (item 1);
- o FAQ foi reescrito para refletir apenas o que existe;
- integrações com e-commerce e marketplaces seguem como **pendência**.
