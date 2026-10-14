#!/usr/bin/env bash
# Procura segredos acidentalmente versionados/empacotados (chaves privadas, tokens, JWTs, .env).
set -uo pipefail
cd "$(dirname "$0")/.."
ALVO="${1:-.}"
EXCLUIR=(--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.data --exclude-dir=.git --exclude-dir=test-results --exclude-dir=playwright-report --exclude=check-secrets.sh --exclude=package-lock.json)
FALHA=0
verificar() {
  local nome="$1" padrao="$2"
  local achados
  achados=$(grep -rIEn "${EXCLUIR[@]}" "$padrao" "$ALVO" 2>/dev/null | grep -v "\.example:" || true)
  if [ -n "$achados" ]; then
    echo "[ALERTA] $nome:"; echo "$achados" | head -20; FALHA=1
  fi
}
verificar "Chave privada PEM"        "-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"
verificar "JWT"                      "eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
verificar "Token de bot do Telegram" "[0-9]{8,10}:AA[A-Za-z0-9_-]{30,}"
verificar "Chave AWS"                "AKIA[0-9A-Z]{16}"
verificar "Chave secreta Supabase"   "sb_secret_[A-Za-z0-9]{20,}"
verificar "Senha SMTP preenchida"    "^SMTP_PASS=.+"
ENVS=$(find "$ALVO" -name ".env" -not -path "*/node_modules/*" 2>/dev/null)
if [ -n "$ENVS" ] && [ "${PERMITIR_ENV_LOCAL:-0}" != "1" ]; then
  echo "[ALERTA] Arquivo(s) .env presentes: $ENVS"; FALHA=1
fi
if [ "$FALHA" = 0 ]; then echo "Nenhum segredo encontrado em $ALVO."; fi
exit $FALHA
