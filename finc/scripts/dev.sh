#!/usr/bin/env bash
# Sobe API (tsx watch) e front-end (Vite) juntos. Ctrl+C encerra os dois.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "Arquivo .env não encontrado. Rode: bash scripts/install.sh" >&2; exit 1; }
npm run build -w @finc/shared >/dev/null
trap 'kill 0' EXIT INT TERM
npm run dev -w @finc/api &
npm run dev -w @finc/web &
wait
