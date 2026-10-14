#!/usr/bin/env bash
# Executa a bateria completa de verificações: tipos, lint, testes unitários/integração, build e E2E.
# Use TEST_DATABASE_URL=postgres://usuario@host:5432/postgres para rodar a API contra PostgreSQL real.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> Pacote compartilhado";            npm run build -w @finc/shared
echo "==> Verificação de tipos";            npm run typecheck
echo "==> Lint";                            npm run lint
echo "==> Testes (shared, API, web)";       npm run test --workspaces --if-present
echo "==> Duplicação de código (jscpd)";    npm run jscpd
echo "==> Build de produção";               npm run build
if [ "${SKIP_E2E:-0}" != "1" ]; then
  echo "==> Testes E2E (Playwright)";       npx playwright test
fi
echo "==> Verificação de segredos";         bash scripts/check-secrets.sh
echo "Todas as verificações passaram."
