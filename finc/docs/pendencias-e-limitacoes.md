# Pendências e limitações

## Dependem de credenciais ou contratos externos

| Item | Situação | O que falta |
|---|---|---|
| Transmissão de NF-e, NFC-e e NFS-e com validade fiscal | Documentos emitidos em homologação, marcados "SEM VALOR FISCAL". O ambiente de produção é bloqueado de propósito | Provedor fiscal homologado, ou integração SOAP direta com a SEFAZ, e as credenciais (`docs/integracoes.md` §5) |
| Cobrança de assinaturas | A troca de plano é imediata e registrada, sem cobrança | Gateway de pagamento e webhook (§6) |
| E-mail | Implementado e testado com um transporte falso | Credenciais SMTP reais |
| Telegram | Implementado e testado com um cliente falso | Token do bot, chat e webhook HTTPS público |

## Não implementado (fora do escopo desta entrega)

- Integração com lojas virtuais e marketplaces. A FINC original prometia no FAQ, mas não implementava.
- Emissão de boletos.
- Matriz e filial (várias empresas por conta) e múltiplos usuários por empresa (equipe com permissões).
- Acesso do contador com login próprio. Hoje ele recebe os documentos por e-mail.
- Custo médio e margem por produto (as compras registram o custo, mas ainda não alimentam a margem).
- Devolução e troca no PDV (hoje feitas cancelando a NFC-e).
- Internacionalização. A interface é só em pt-BR.

## Limitações conhecidas

- **Seleção de itens na emissão, no PDV, em compras e em orçamentos:** os seletores carregam até 200 clientes, produtos e serviços ativos. Contas no BLACK com catálogos maiores precisarão de busca incremental no seletor.
- **"Modo responder" do Telegram:** fica em memória por 15 minutos. Com várias instâncias da API, use o painel web de chamados.
- **Notificações:** são atualizadas por consulta periódica (60 s no sino e 15 s no chat), sem WebSocket.
- **`node-forge`:** há um alerta high sem correção publicada (função não utilizada). Acompanhe novas versões.
- **`buffers@0.1.1`:** dependência transitiva do `exceljs` sem licença declarada. Se for preciso, a importação pode ficar restrita a CSV.
- **Valores dos planos:** os valores e limites originais ficavam só no Supabase e não puderam ser recuperados. A FINC 2.0 usa valores padrão (R$ 29,90 e R$ 79,90), ajustáveis por SQL.
- **CPF/CNPJ do titular:** não pode ser alterado pela interface (é a identidade fiscal e o login). A alteração exige suporte.
- **Bling:** o site estava bloqueado no ambiente de execução. A referência funcional foi feita só com descrições públicas.
- **Migração dos dados do Supabase original:** não foi feita, porque não houve acesso ao banco de produção. Os clientes, produtos e serviços podem ser exportados do sistema antigo e importados por planilha. Os cabeçalhos dos modelos antigos são aceitos.
