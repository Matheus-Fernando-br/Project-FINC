# Bling como referência funcional

O Bling (bling.com.br) é um ERP brasileiro para pequenas empresas e e-commerce. Ele foi usado **apenas como referência de funcionalidades e de fluxos de gestão**.

## Limitações e cuidados

- O acesso ao site `www.bling.com.br` foi **bloqueado pela política de rede do ambiente de execução** (HTTP 403 no proxy). Não houve navegação nem testes no produto.
- A referência foi construída a partir de **descrições públicas**: o blog oficial do Bling e avaliações de terceiros (Capterra, B2B Stack, Software Advice, blogs Loggi e HostGator), consultadas por busca web em 14/10/2026.
- **Nada foi copiado:** nenhum código, texto, marca, layout, ícone ou material do Bling. A FINC 2.0 tem nome, logotipo, paleta de cores (verde FINC e azul-marinho), textos e implementação próprios.

## Módulos de referência identificados

| Módulo (referência pública) | Ideia funcional | Implementação própria na FINC 2.0 |
|---|---|---|
| Cadastros | Clientes, produtos e serviços centralizados | Cadastros com validação fiscal, busca, paginação, importação e exportação |
| Controle de estoque | Entradas e saídas, estoque atualizado pelas notas | Movimentações (entrada, saída, ajuste), baixa automática na emissão, estorno no cancelamento e alerta de mínimo |
| Vendas / pedidos | Pedido de venda que vira nota | Pedidos de venda com geração de rascunho de NF-e, NFC-e ou NFS-e |
| Notas fiscais | Emissão a partir do pedido e histórico fiscal | Documentos persistidos, numeração sequencial, histórico com filtros, PDF e XML |
| Financeiro | Contas a pagar e a receber | Lançamentos, baixa, estorno, vencidas e saldo previsto. A nota emitida gera a conta a receber |
| Painéis | Indicadores do negócio | Painel com faturamento de 12 meses, principais clientes e itens, estoque baixo e uso do plano |
| Envio ao contador | Documentos enviados ao contador | Envio de PDF e XML por e-mail ao contador cadastrado |
| Integrações com lojas virtuais e marketplaces | Sincronização de pedidos | **Não implementado** (pendência, ver `../pendencias-e-limitacoes.md`) |
| Boletos e cobrança | Emissão de boletos | **Não implementado** (depende de banco ou gateway) |
| Matriz e filial | Várias empresas na mesma conta | **Não implementado**: a FINC usa uma conta por CPF/CNPJ |

## Fontes consultadas (somente leitura de descrições públicas)

- [blog.bling.com.br — 5 funcionalidades do Bling que você precisa conhecer](https://blog.bling.com.br/funcionalidades-bling-que-voce-precisa-conhecer/)
- [Loggi — O que é Bling e como funciona o sistema ERP](https://www.loggi.com/conteudos/gestao/o-que-e-bling/)
- [HostGator — Bling](https://www.hostgator.com.br/blog/bling/)
- [Capterra — Bling](https://www.capterra.ch/software/191410/bling)
- [B2B Stack — Bling ERP](https://www.b2bstack.com.br/product/bling-erp/avaliacoes)
- [Software Advice — Bling](https://www.softwareadvice.com/product/470071-Bling)
