# Plataforma FINC - Emissão de Notas Fiscais e Gestão Financeira

![FINC Logo](https://raw.githubusercontent.com/Matheus-Fernando-br/Project-FINC/main/Front-End/public/Images/FINC.png)

##  Visão Geral do Projeto

O FINC é uma solução SaaS (Software as a Service) projetada para simplificar a vida de Microempreendedores Individuais (MEIs) e pequenos prestadores de serviços. A plataforma oferece uma experiência unificada e intuitiva para emissão de Notas Fiscais (NF-e e NFS-e), gestão de clientes, produtos, serviços e acompanhamento financeiro, eliminando a complexidade dos sistemas governamentais e o alto custo de emissores privados.

O sistema foi concebido com uma arquitetura moderna e escalável, pronta para futuras expansões como integração com meios de pagamento, relatórios avançados e automações.

---

##  Tecnologias Utilizadas

O projeto é construído sobre uma stack de tecnologias modernas e robustas, garantindo performance, segurança e manutenibilidade.

**Front-end:**
*   **React:** Biblioteca para construção de interfaces de usuário reativas e componentizadas.
*   **Vite:** Ferramenta de build extremamente rápida para desenvolvimento front-end.
*   **CSS Modules:** Para estilização escopada e modular, evitando conflitos de CSS.
*   **React Router:** Para gerenciamento de rotas na aplicação.

**Back-end:**
*   **Node.js com Express (ou similar):** Ambiente de execução para a lógica de negócio e APIs.
*   **API RESTful:** Arquitetura de comunicação entre o front-end e o back-end.

**Banco de Dados e Autenticação:**
*   **Supabase:** Plataforma open-source que fornece:
    *   **PostgreSQL Database:** Banco de dados relacional robusto.
    *   **Auth:** Gerenciamento completo de autenticação (login, cadastro, recuperação de senha) e segurança a nível de linha (Row Level Security).
    *   **Storage:** Para armazenamento de arquivos e documentos.

**Infraestrutura (Deploy):**
*   **Vercel:** Para deploy contínuo e hospedagem do front-end.
*   **Render:** Para deploy contínuo e hospedagem do back-end (servidor/API).

---

##  Arquitetura do Sistema

A arquitetura do FINC é desacoplada, separando as responsabilidades entre o cliente (front-end) e o servidor (back-end), com o Supabase atuando como uma camada de persistência e autenticação.

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   Usuário      │──────│   Front-end    │──────│    Back-end    │
│  (Browser)     │      │ (React/Vite)   │      │ (Node/Render)  │
└────────────────┘      └───────┬────────┘      └───────┬────────┘
                                │                       │
                                │      API RESTful      │
                                │                       │
                                └───────────┬───────────┘
                                            │
                                  ┌─────────▼─────────┐
                                  │     Supabase      │
                                  │ (DB, Auth, Storage)│
                                  └───────────────────┘
```

*   **Front-end (Vercel):** Responsável pela interface do usuário (UI) e experiência do usuário (UX). Consome os dados da API do back-end e interage diretamente com o Supabase para autenticação.
*   **Back-end (Render):** Contém a lógica de negócio, integrações com APIs externas (ex: emissão de NF) e expõe os endpoints seguros para o front-end.
*   **Supabase:** Centraliza o banco de dados, o controle de acesso dos usuários e o armazenamento de arquivos, garantindo segurança e escalabilidade.

---

##  Estrutura de Pastas (Front-end)

A organização das pastas no front-end segue um padrão modular e escalável.

```
/src
|-- /api           # Funções de chamada à API (ex: axios, fetch)
|-- /assets        # Imagens, fontes e outros arquivos estáticos
|-- /components    # Componentes React reutilizáveis (Botões, Inputs, Cards)
|-- /contexts      # Contextos da aplicação (Autenticação, Tema)
|-- /hooks         # Hooks customizados (useAuth, useApi)
|-- /pages         # Componentes de página (Login, Dashboard, Clientes)
|-- /routes        # Configuração das rotas da aplicação
|-- /styles        # Arquivos de estilização globais e variáveis CSS
|-- /utils         # Funções utilitárias (formatação, validação)
|-- App.jsx        # Componente raiz da aplicação
|-- main.jsx       # Ponto de entrada da aplicação
```

---

##  Configuração de Ambiente (`.env`)

Para rodar o projeto localmente, crie um arquivo `.env` na raiz do diretório `Front-End` e `Back-End` com as seguintes variáveis:

**Front-end (`/Front-End/.env`):**
```env
# URL da sua API do Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave anônima (pública ) do Supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```

**Back-end (`/Back-End/.env`):**
```env
# URL da sua API do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co

# Chave de serviço (secreta ) do Supabase
SUPABASE_SERVICE_KEY=sua-chave-de-servico-secreta

# Porta em que o servidor irá rodar
PORT=3001

# Outras chaves de API (ex: API de emissão de NF)
NF_API_KEY=sua-chave-da-api-de-notas
```

---

##  Como Rodar Localmente

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento.

**Pré-requisitos:**
*   Node.js (versão 18 ou superior)
*   npm ou Yarn
*   Conta no Supabase, Vercel e Render.

**1. Clone o Repositório:**
```bash
git clone https://github.com/Matheus-Fernando-br/Project-FINC.git
cd Project-FINC
```

**2. Configure o Back-end:**
```bash
cd Back-End
npm install
# Preencha o arquivo .env com suas chaves
npm run dev
```
O servidor back-end estará rodando em `http://localhost:3001`.

**3. Configure o Front-end:**
```bash
cd ../Front-End
npm install
# Preencha o arquivo .env com suas chaves
npm run dev
```
A aplicação estará acessível em `http://localhost:5173` (ou outra porta indicada pelo Vite ).

---

##  Deploy

**Front-end (Vercel):**
1.  Conecte sua conta do GitHub à Vercel.
2.  Importe o repositório `Project-FINC`.
3.  Configure o "Root Directory" para `Front-End`.
4.  Adicione as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) nas configurações do projeto na Vercel.
5.  Faça o deploy. A Vercel irá automaticamente fazer o build e o deploy a cada `push` na branch principal.

**Back-end (Render):**
1.  Crie um novo "Web Service" no Render e conecte seu repositório do GitHub.
2.  Configure o "Root Directory" para `Back-End`.
3.  Defina o comando de build como `npm install` e o comando de start como `npm start`.
4.  Adicione as variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, etc.) nas configurações do serviço no Render.
5.  Faça o deploy.

---

##  Autenticação e Permissões

A autenticação é gerenciada pelo **Supabase Auth**. O controle de acesso a nível de banco de dados é implementado usando **Row Level Security (RLS)**.

*   **Fluxo de Login:** O usuário insere suas credenciais no front-end, que as envia para o Supabase. Em caso de sucesso, o Supabase retorna um JWT (JSON Web Token) que é armazenado no cliente para autenticar requisições futuras.
*   **Políticas de RLS:** As tabelas no Supabase possuem políticas que garantem que um usuário só possa ler ou modificar os dados que lhe pertencem. Por exemplo, um usuário do tipo "empresa" só pode acessar os clientes e notas fiscais associados ao seu `user_id`.

---

##  Boas Práticas e Observações

*   **Não exponha chaves secretas:** A `VITE_SUPABASE_ANON_KEY` é segura para ser exposta no front-end, mas a `SUPABASE_SERVICE_KEY` nunca deve sair do back-end.
*   **CSS Modular:** Utilize arquivos `.module.css` para evitar conflitos de estilo e manter os componentes encapsulados.
*   **Componentização:** Crie componentes pequenos e reutilizáveis sempre que possível.
*   **Tratamento de Erros:** Implemente um tratamento de erros robusto tanto no front-end (para feedback ao usuário) quanto no back-end (para logs e monitoramento).
*   **Segurança:** Valide e sanitize todas as entradas do usuário no back-end antes de processá-las ou salvá-las no banco de dados.
