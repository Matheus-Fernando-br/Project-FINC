# Guia de uso da FINC

Este guia mostra como usar cada módulo no dia a dia. A FINC é organizada como um ERP. O menu superior tem os módulos **Início, Cadastros, Suprimentos, Vendas, Notas fiscais, Finanças e Relatórios**.

- Ao clicar num módulo, abre um painel com as telas dele.
- Dentro de um módulo, a barra logo abaixo do menu (submenu) troca de tela.
- No celular e no tablet, tudo fica no botão **☰** (canto superior direito).

Atalhos úteis:

- **Ctrl + K** (ou **⌘ + K** no Mac), ou a lupa no topo: busca clientes, produtos, serviços, fornecedores e notas.
- **Emitir nota**: botão verde no topo, disponível em qualquer tela.
- **Sino**: notificações (nota emitida, estoque baixo, resposta do suporte…).
- **Bolinha com suas iniciais**: Meus dados, Planos, Notificações, Configurações, Ajuda e Sair.

---

## 1. Primeiros passos (uma vez só)

1. **Crie a conta** em *Criar conta*. Informe:
   - nome ou razão social;
   - CPF (pessoa física) ou CNPJ (MEI ou empresa);
   - e-mail, telefone e senha (mínimo 8 caracteres, com letras e números);
   - aceite dos termos.

   A conta nasce no plano **BÁSICO**.
2. **Complete Meus dados** (bolinha com as iniciais › *Meus dados*): telefone, inscrições e **endereço completo**. O endereço do emitente é **obrigatório para emitir notas**. Ao digitar o CEP e sair do campo, rua, bairro, cidade e UF são preenchidos sozinhos.
3. **Revise a Configuração fiscal** (*Notas fiscais › Configuração fiscal*): série, próximo número, natureza da operação padrão, CFOP padrão, regime tributário e se os tributos são somados ao total.
4. *(Opcional)* Envie o **certificado digital A1** (*Notas fiscais › Certificado digital*).
5. Cadastre os seus **clientes, produtos e serviços**, um a um ou por planilha (seção 2.5).

> O login aceita **e-mail ou CPF/CNPJ**. Esqueceu a senha? Use *Esqueci minha senha* na tela de login. O link chega por e-mail e vale 1 hora.

## 2. Cadastros

### 2.1 Clientes

*Cadastros › Clientes › Novo*

- Informe nome ou razão social, tipo (PF/PJ) e CPF ou CNPJ. Os dígitos verificadores são conferidos.
- Opcionais: inscrição estadual (PJ), contatos e endereço (o CEP preenche o restante).
- Na lista dá para **buscar**, clicar numa linha para **editar**, **excluir** e **Exportar CSV**.

### 2.2 Fornecedores

*Cadastros › Fornecedores*: CNPJ ou CPF, pessoa de contato, e-mail, telefone e endereço. Os fornecedores são usados nos **pedidos de compra** e nas **contas a pagar**.

### 2.3 Produtos

*Cadastros › Produtos › Novo*

- **Dados:** nome, SKU (único), categoria, unidade, preço e descrição.
- **Tributação:** NCM (8 dígitos), CFOP (4 dígitos), origem (0 a 8), ICMS % e PIS/COFINS %.
- **Estoque:** marque *Controlar estoque* para informar o **estoque inicial** e o **mínimo**. Ao chegar no mínimo, você recebe uma notificação.
- Desmarque *Produto ativo* para que ele não apareça mais na emissão nem no PDV, sem precisar excluí-lo.

### 2.4 Serviços

*Cadastros › Serviços › Novo*: nome, categoria, preço, unidade, **CNAE (7 dígitos)**, código do serviço, item da LC 116 e alíquota de ISS. Os serviços entram na **NFS-e**.

### 2.5 Importar por planilha

Nas listas de clientes, produtos e serviços, clique em **Importar planilha**:

1. Baixe o **modelo CSV**. Os modelos `.xlsx` da FINC antiga também são aceitos.
2. Preencha a planilha e envie o arquivo `.csv` (separado por `;`) ou `.xlsx`. O limite é de 2000 linhas.
3. Confira o **relatório**: o que entrou, as linhas rejeitadas e os motivos (ex.: CPF inválido, duplicado) e as colunas ignoradas. Corrija só as linhas rejeitadas e importe de novo.

### 2.6 Contadores

*Cadastros › Contadores*: cadastre o seu contador (nome, e-mail, CRC). Depois, em cada nota emitida, use **Enviar ao contador** para mandar o PDF e o XML por e-mail.

## 3. Suprimentos

### 3.1 Estoque

*Suprimentos › Estoque*: mostra o saldo de cada produto com controle de estoque, o mínimo e a situação, além do histórico de movimentações.

- **Nova movimentação** tem três tipos:
  - **Entrada:** compra avulsa ou devolução;
  - **Saída:** perda ou consumo;
  - **Ajuste:** define o saldo exato, útil após um inventário.
- O saldo nunca fica negativo.
- O estoque também muda sozinho: **diminui** quando uma nota é emitida (ou numa venda no PDV), **volta** quando a nota é cancelada e **aumenta** quando uma compra é recebida.

### 3.2 Pedidos de compra

*Suprimentos › Pedidos de compra › Nova compra*

1. Escolha o **fornecedor**, a **previsão de entrega** e os itens (produto, quantidade, custo unitário). Informe frete e desconto, se houver.
2. Clique em **Salvar compra**. A compra fica *Aberta* e ainda pode ser editada.
3. Quando a mercadoria chegar, clique em **Receber compra** (o vencimento é opcional; o padrão é 30 dias). A FINC então:
   - dá **entrada no estoque** de cada produto que tem controle de estoque;
   - lança a **conta a pagar** ao fornecedor em *Finanças*.
4. Para desistir de uma compra ainda aberta, use **Cancelar**.

## 4. Vendas

### 4.1 Orçamentos

*Vendas › Orçamentos › Novo orçamento*

1. Escolha o cliente, a validade e os itens (produtos e/ou serviços). O valor sugerido é o do cadastro e pode ser alterado.
2. Preencha desconto, condições de pagamento e observações, e salve. Use **Imprimir** para gerar o PDF pelo navegador e enviar ao cliente.
3. Registre a resposta: **Aprovar** ou **Recusar**. *Reabrir* volta o orçamento para "Em aberto".
4. **Gerar pedido de venda** transforma o orçamento num pedido, sem redigitar nada.

Orçamentos fora da validade aparecem como **Vencido**.

### 4.2 Pedidos de venda

*Vendas › Pedidos de venda*: registre o pedido (cliente, itens, desconto).

- Quando for faturar, escolha o tipo (**NF-e**, **NFC-e** ou **NFS-e**) e clique em **Gerar nota**. A FINC cria um **rascunho** da nota com os itens do pedido; revise e emita.
- Um pedido com produtos e serviços misturados precisa de duas notas. A NFS-e aceita só serviços; a NF-e e a NFC-e, só produtos.

### 4.3 Frente de caixa (PDV)

*Vendas › Frente de caixa*: é a venda de balcão.

1. Toque nos produtos para adicioná-los. Use **+** e **−** para mudar a quantidade e a busca para filtrar por nome ou SKU.
2. O cliente é opcional. Se ficar vazio, a venda sai para o **Consumidor final**.
3. Escolha a **forma de pagamento**. Em *Dinheiro*, informe o valor recebido e a FINC calcula o **troco**.
4. Clique em **Finalizar venda**. A FINC:
   - emite a **NFC-e**;
   - baixa o estoque;
   - lança o recebimento no financeiro **já como pago**.

   Clique em *Ver cupom (PDF)* para imprimir.

## 5. Notas fiscais

### 5.1 Emitir

*Emitir nota* (botão verde) ou *Notas fiscais › Emitir nota*:

1. **Tipo:**
   - NF-e: venda de produtos;
   - NFC-e: venda ao consumidor (o cliente é opcional);
   - NFS-e: serviços.
2. **Cliente** e **natureza da operação**.
3. **Itens:** o valor do catálogo vem preenchido e pode ser alterado. Os totais e tributos são calculados na hora.
4. **Transporte** (NF-e/NFC-e): marque *Incluir frete* para informar transportador, placa e pesos.
5. **Valores:** descontos, *Lançar conta a receber* (com vencimento) e observações.
6. Escolha **Salvar rascunho** (pode ser editado depois) ou **Emitir documento** (recebe número sequencial).

Ao emitir, a FINC confere o endereço do emitente, o limite do plano e o estoque. Em seguida:

- baixa o estoque;
- lança a conta a receber;
- envia uma notificação.

### 5.2 Consultar, baixar, enviar e cancelar

*Notas fiscais › Notas fiscais*: filtre por status, tipo, período ou cliente/número. Clique numa nota para:

- **Ver PDF**, **Baixar PDF** e **Baixar XML**;
- **Enviar ao contador**, que manda o PDF e o XML por e-mail (requer SMTP configurado no servidor);
- **Cancelar**: exige uma justificativa com pelo menos 15 caracteres. O estoque é devolvido e a conta a receber em aberto é cancelada. Se o recebimento já foi baixado, **estorne-o primeiro** em *Finanças*.

> ⚠️ **Validade fiscal:** sem a integração com um provedor fiscal homologado, os documentos saem em **homologação**, com a marca **SEM VALOR FISCAL**. Se você mudar o ambiente para *Produção* sem essa integração, a emissão é bloqueada de propósito. Veja [integracoes.md](integracoes.md).

### 5.3 Certificado digital A1

*Notas fiscais › Certificado digital*: envie o arquivo `.pfx`/`.p12` e a senha. A FINC confere:

- se a senha abre o arquivo;
- se o arquivo contém a chave privada;
- se o certificado está dentro da validade;
- se o CPF/CNPJ do certificado é o mesmo da sua conta.

O arquivo e a senha ficam guardados **criptografados**. Quando faltarem 30 dias para o vencimento, a tela avisa.

## 6. Finanças

*Finanças › Contas a receber / Contas a pagar / Todos os lançamentos*

- Os **cards** do topo mostram: a receber, a pagar, saldo previsto e o realizado no mês.
- Em **Novo lançamento**, informe tipo, valor, descrição, vencimento, categoria e cliente.
- **Baixar** registra o pagamento ou recebimento, com data e forma.
- **Estornar** volta o lançamento para "em aberto".
- Contas vencidas aparecem com o selo **Vencida**.
- Lançamentos criados por nota, compra ou PDV só aceitam baixa ou estorno. Para alterar um deles, altere a origem (por exemplo, cancelando a nota).

## 7. Relatórios

*Relatórios* (escolha o relatório no seletor do topo e ajuste o período):

| Relatório | O que mostra |
|---|---|
| **Vendas** | Total vendido, agrupado por dia (com gráfico), cliente, produto/serviço ou tipo de nota |
| **DRE** | Receitas recebidas e despesas pagas no período, por categoria, e o resultado (regime de caixa) |
| **Fluxo de caixa** | Por dia: entradas e saídas realizadas, a receber, a pagar e o saldo acumulado (com gráfico) |
| **Estoque** | Saldo de cada produto e valor do estoque pelo preço de venda, destacando os itens abaixo do mínimo |

Todos têm **Exportar CSV** (abre no Excel) e **Imprimir**. O período máximo é de 2 anos.

## 8. Painel (Início)

Mostra:

- faturamento do mês e dos últimos 12 meses (com gráfico);
- valores a receber e a pagar;
- uso do plano (barras que ficam laranja perto do limite e vermelhas no limite);
- principais clientes, itens mais vendidos, produtos com estoque baixo e documentos recentes.

Os **Atalhos rápidos** são personalizáveis em *Personalizar*, com até 9 atalhos.

## 9. Minha conta (bolinha com as iniciais)

- **Planos:** compare o BÁSICO e o BLACK e troque de plano. O downgrade é bloqueado se o seu uso atual passar dos limites do plano menor. A cobrança automática ainda não está integrada (a tela informa isso).
- **Notificações:** histórico, marcar como lida e o canal de e-mail. Quando o servidor tem SMTP, dá para ativar o recebimento por e-mail e enviar um teste.
- **Configurações:**
  - *Fiscal*;
  - *Geral e atalhos*: fuso horário, formato de data, página inicial depois do login, modo compacto;
  - *Aparência*: tema claro, escuro ou automático, tamanho da fonte e negrito, salvos neste aparelho;
  - *Segurança e privacidade*: trocar a senha, ver e encerrar sessões em outros aparelhos, ver o histórico de atividades, **exportar todos os seus dados** e **excluir a conta**;
  - *Integrações*: a situação real de cada integração.
- **Ajuda e suporte:**
  - abrir **chamados** e conversar com a equipe;
  - verificar o **status do sistema**;
  - enviar **feedback**.

## 10. Para a equipe de suporte (administradores)

1. Promova o usuário a administrador no servidor com `npm run admin:promover -w @finc/api -- email@empresa.com`.
2. No menu da conta, abra **Chamados (equipe)**: filtre por status, **Aceitar**, **Responder** e **Encerrar**. O cliente é notificado a cada resposta.
3. Com o Telegram configurado, os chamados também chegam no grupo da equipe, com botões para aceitar, responder e encerrar.

## Dúvidas frequentes

| Pergunta | Resposta |
|---|---|
| Não consigo emitir: "Complete o endereço do emitente" | Preencha CEP, UF, cidade, logradouro e número em *Meus dados* |
| "Limite do seu plano atingido" | O BÁSICO tem limites de notas por mês, clientes, produtos, serviços e contadores. Troque para o BLACK em *Planos* |
| "Estoque insuficiente" | Registre uma entrada em *Estoque*, receba a compra pendente ou desmarque *Controlar estoque* no produto |
| Não recebo e-mails | O servidor precisa de SMTP configurado (veja [configuracao.md](configuracao.md#5-e-mail-smtp)). Confira também a caixa de spam |
| A busca do CEP não funciona | O servidor está sem acesso ao ViaCEP. Preencha o endereço à mão |
| Fui desconectado | A sessão dura 8 horas por padrão, e trocar a senha encerra os outros aparelhos. Entre de novo |
