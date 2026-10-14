#!/usr/bin/env bash
# Instalação da FINC 2.0 em Linux: verifica pré-requisitos, instala dependências, cria .env e prepara o banco.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Verificando Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale a versão 22.12 ou superior (https://nodejs.org ou nvm install 22)." >&2
  exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
NODE_MINOR=$(node -p "process.versions.node.split('.')[1]")
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; }; then
  echo "Node.js $(node -v) é antigo. Requer >= 22.12." >&2
  exit 1
fi
echo "    Node.js $(node -v) / npm $(npm -v)"

echo "==> Instalando dependências (npm ci)"
npm ci --no-audit --no-fund

if [ ! -f .env ]; then
  echo "==> Criando .env a partir de .env.example"
  cp .env.example .env
  SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")
  CERTKEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=${SECRET}|" .env
  sed -i "s|^CERT_ENCRYPTION_KEY=.*|CERT_ENCRYPTION_KEY=${CERTKEY}|" .env
  chmod 600 .env
  echo "    .env criado com segredos aleatórios (permissão 600)."
else
  echo "==> .env já existe — mantido."
fi

echo "==> Compilando pacote compartilhado"
npm run build -w @finc/shared

echo "==> Aplicando migrações do banco"
npm run migrate

echo
echo "Instalação concluída."
echo "  Desenvolvimento: npm run dev      (web em http://localhost:5173, API em http://localhost:3333)"
echo "  Testes:          npm test"
echo "  Produção:        bash scripts/prod.sh"
