# FINC

Plataforma de gestão e documentos fiscais para MEIs e pequenas empresas, organizada como um ERP: cadastros, estoque, compras, vendas (PDV, orçamentos e pedidos), notas fiscais (NF-e, NFC-e e NFS-e), finanças e relatórios.

Todo o código fica em [`finc/`](finc/README.md):

| Pasta | Conteúdo |
|---|---|
| `finc/apps/web` | Front-end (React 19 + Vite), publicado na Vercel |
| `finc/apps/api` | Back-end (Express 5 + TypeScript), publicado no Render |
| `finc/packages/shared` | Regras compartilhadas: schemas Zod, validações e máscaras, cálculo fiscal |
| `finc/db/migrations` | SQL do banco (PostgreSQL / Supabase) |
| `finc/docs` | Documentação: uso, configuração, implantação e arquitetura |

## Começando

```bash
cd finc
bash scripts/install.sh   # ou: npm ci && cp .env.example .env && npm run build -w @finc/shared && npm run migrate
npm run dev               # site em http://localhost:5173 e API em http://localhost:3333
```

Requer Node.js 22.12 ou superior. Detalhes em [`finc/README.md`](finc/README.md) e no guia de implantação [`finc/docs/deploy-vercel-render-supabase.md`](finc/docs/deploy-vercel-render-supabase.md).
