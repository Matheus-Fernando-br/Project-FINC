#!/usr/bin/env bash
# Build e execução em modo produção (API servindo o front-end compilado na mesma origem).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "Arquivo .env não encontrado. Rode: bash scripts/install.sh" >&2; exit 1; }
npm run build
set -a; . ./.env; set +a
export NODE_ENV=production SERVE_WEB=true
node apps/api/dist/db/migrate-cli.js
exec node apps/api/dist/server.js
