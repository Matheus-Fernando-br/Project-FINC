# Engenharia reversa da FINC original

- **Repositório:** `Matheus-Fernando-br/Project-FINC`, branch base no commit `9fc0be3`.
- **Preservação:** o código original foi mantido intacto em `Back-End/` e `Front-End/`, na raiz do repositório. A FINC 2.0 está em `finc/`.
- **Auditoria dinâmica:** feita numa cópia separada. Os resultados estão em [auditoria-finc-original.md](auditoria-finc-original.md).

## 1. Stack e estrutura

| Camada | Tecnologia | Observações |
|---|---|---|
| Front-end | React 19 com Create React App (`react-scripts` 5), React Router 7, Recharts, framer-motion, html2pdf.js, xlsx | 60 arquivos JS e nenhum teste. Bundle principal de 618 kB (gzip), com source maps publicados |
| Back-end | Node e Express 4 (ESM), Supabase JS, axios, helmet, express-rate-limit, csrf, cookie-parser | 27 arquivos. `node_modules` versionado no git (1.524 arquivos) |
| Dados e autenticação | Supabase (PostgreSQL, Auth e RLS) | **Não havia migrações nem SQL versionado.** O schema abaixo foi inferido do código |
| Deploy | Vercel (front) e Render (API) | Domínios diferentes, o que exige `SameSite=None` e causava problemas de CSRF e cookies |

Histórico Git: 50 commits com 4 identidades de autor (3 variações do nome do mantenedor e "Your Name", sinal de git sem configuração), sem padrão de mensagens (ex.: "Ajustes planos", "gIRE O DISPOSITIVO").

## 2. Schema inferido (Supabase)

| Tabela | Colunas usadas pelo código |
|---|---|
| `profiles` | `id` (= auth.users.id), `user_id` (usado só em `planos.controller`, **inconsistente** com `id`), `social_name`, `tipo_pessoa`, `cpf_cnpj`, `telefone`, `inscricao`, `cep`, `uf`, `cidade`, `logradouro`, `bairro`, `numero`, `complemento`, `id_plan` |
| `planos` | `id`, `nome`/`Nome`, `valor`, `limite_notas`, `limite_clientes`, `limite_produtos`, `limite_servicos`, `limite_contadores`, `detalhes` (JSON ou texto), `criado_em` |
| `clientes` | `user_id`, `nome_social`, `tipo_pessoa` (`PFisica`/`PJuridica`), `cpf_cnpj`, `email`, `telefone`, `whatsapp`, endereço |
| `produtos` | `user_id`, `nome`, `fabricante`, `categoria`, `descricao`, `sku`, `unidade_medida`, `preco_unitario`, `ncm`, `cfop`, `icms`, `pis_cofins`, `origem` |
| `servicos` | `user_id`, `nome`, `categoria`, `codigo_interno`, `descricao_detalhada`, `preco`, `unidade_medida`, `cnae`, `codigo_servico`, `item_lista`, `aliquota_iss`, `cst_pis_cofins`, `regime_especial`, `municipio` |
| `contadores` | `profile_id`, `nome`, `email`, `cpf`, `telefone`, `criado_em` |
| `chamados` | `protocolo`, `user_id`, `categoria`, `assunto`, `status` (`aberto`, `aceito` ou `fechado`) |
| `mensagens` | `chamado_id`, `autor` (`cliente` ou `admin`), `mensagem`, `criado_em` |
| `users` | Consultada em `chamados.js` para obter nome e e-mail. Provavelmente inexistente: o código usa um *fallback* |

Notas fiscais **não eram persistidas**. A emissão montava os dados no `localStorage` e gerava PDF (html2pdf no navegador) e XML (string no navegador) sem gravar nada.

## 3. Rotas da API original

| Rota | Autenticação | Função |
|---|---|---|
| `POST /auth/login` | Pública (rate limit) | Login por e-mail ou CPF/CNPJ |
| `POST /auth/register` | Pública | Cadastro (Supabase Admin e `profiles`) |
| `POST /auth/logout`, `GET /auth/me` | Cookie | Sessão |
| `GET/POST/PUT/DELETE /clientes`, `PUT /clientes` (importação) | Cookie e CSRF | CRUD |
| Idem para `/produtos` e `/servicos` | Cookie e CSRF | CRUD com `update(req.body)` (mass assignment) |
| `/contadores` | Cookie e CSRF | CRUD **sem limite de plano no servidor** |
| `GET /api/profile/me`, `PUT /api/profile`, `PUT /api/profile/password` | Cookie e CSRF | Perfil e senha |
| `GET /planos` (pública), `/planos/meu`, `/planos/disponiveis`, `PUT /planos/meu` | Misto | Planos. A troca não tinha regra de downgrade nem cobrança |
| `POST /chamados`, `POST /mensagem`, `GET /mensagens/:id`, `GET /chamados/:id`, `PUT /chamados/:id/encerrar`, `POST /feedback` | **Nenhuma** | Suporte (IDOR) |
| `POST /telegram-webhook` | **Nenhuma** | Bot de suporte |

## 4. Telas do front-end original e situação

| Tela (rota original) | Situação real | Na FINC 2.0 |
|---|---|---|
| Landing, Planos, Quem somos, Dúvidas, Termos | Funcionais. O FAQ prometia integração com e-commerce e acesso para contadores, que não existiam | Mantidas, com textos honestos |
| Login, Cadastro, Esqueci senha, Redefinir | Funcionais (Supabase). A URL de redefinição era fixa na Vercel | Autenticação própria e redefinição via SMTP |
| `/app` (Dashboard) | **Gráficos com dados fictícios** ("Cliente A", "Produto X") e atalhos no localStorage | Indicadores reais e atalhos salvos no servidor |
| Emitir nota (2 etapas) | PDF e XML gerados no navegador, **sem persistência**, numeração fixa `000000001` | Rascunho, emissão numerada, persistência, PDF e XML no servidor, cancelamento |
| Clientes, Produtos, Serviços (CRUD e importação xlsx) | Funcionais, com código duplicado | Fábrica CRUD única e importação com relatório |
| Contador | Funcional | Mantido, com limite de plano e envio de documentos por e-mail |
| Planos (meu plano e trocar) | Funcional | Mantido, com regra de downgrade e histórico |
| Meus dados | Funcional (CEP via ViaCEP no navegador) | Mantido (CEP pelo servidor) |
| Certificado | **Só visual**: guardava o arquivo em memória e mostrava "validado" | Validação real (senha, chave, validade e titular) e cofre cifrado |
| Notificações | **Simulada**: estado local e `alert()` | Notificações reais e canal de e-mail real |
| Configurações › Geral, Notas, Financeiro | **Sem persistência** (estado local) | Configurações fiscais e preferências salvas no banco |
| Configurações › Pagamento | **Formulário de cartão fictício** | Removido. Histórico de assinaturas e pendência documentada |
| Configurações › Integrações | Textual | Situação real, lida de `/api/health` |
| Configurações › Segurança | Troca de senha | Troca de senha, sessões, atividade e LGPD |
| Aparência | localStorage (tema, fonte, negrito) | Mantida |
| Ajuda, chamado e chat | Lista de chamados **quebrada** (rota inexistente) e URLs fixas | Chamados autenticados e painel da equipe |

## 5. Regras de negócio preservadas

- Cadastro como pessoa física (CPF) ou jurídica (CNPJ), com validação de dígito verificador. A senha precisa ter pelo menos 8 caracteres, com letras e números.
- Login por e-mail **ou** CPF/CNPJ, com mensagem de erro genérica.
- Planos **BÁSICO** e **BLACK** com limites de notas, clientes, produtos, serviços e contadores (null = ilimitado).
- NFS-e só aceita serviços. NF-e e NFC-e só aceitam produtos.
- Total do documento = produtos + serviços + ICMS + ISS + PIS/COFINS − desconto incondicional − desconto condicional. Preservado como padrão e configurável: veja as decisões técnicas.
- Frete: "0 - Por conta do remetente" ou "9 - Sem frete", com transportador, placa e pesos.
- Estrutura do XML `<notaFiscal>` (meta, emissor, destinatário, transporte, itens e totais), mantida e ampliada.
- Catálogos de categorias, unidades de medida e origem (0 a 8) dos formulários originais.
- Chamados com protocolo, status `aberto`, `aceito` ou `fechado`, e atendimento pelo Telegram (aceitar, responder, encerrar).
- Importação por planilha. Os cabeçalhos dos modelos `.xlsx` originais (`nome`, `tipoPessoa`, `rua`, `category`, `unitType`, `productOrigin`…) continuam aceitos.
- Preferências de aparência (tema, tamanho de fonte, negrito).
- Rotas antigas (`/TelaInicial/Login`, `/reset-password`, `/MeusDados`…) redirecionam para as novas.
