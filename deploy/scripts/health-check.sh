#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Remember explicitly passed env vars before .env can override them
__HEALTH_URL="${HEALTH_URL:-}"

# Load .env if present
if [ -f "$DEPLOY_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$DEPLOY_DIR/.env"
  set +a
fi

# Restore explicitly passed values (command-line / parent process overrides .env)
[ -n "$__HEALTH_URL" ] && HEALTH_URL="$__HEALTH_URL"

HEALTH_URL="${HEALTH_URL:-}"
[ -n "$HEALTH_URL" ] || { echo "❌ HEALTH_URL is required (set in deploy/.env or env)"; exit 1; }

echo "🩺 Health check: ${HEALTH_URL}"
for i in {1..12}; do
  HTTP_CODE=$(curl -fsSL --max-time 10 -w "%{http_code}" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" \
    "$HEALTH_URL" -o /tmp/health_response.html || true)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP 200)"
    exit 0
  fi
  echo "   Attempt ${i}/12 failed (HTTP ${HTTP_CODE:-no response})..."
  sleep 5
done

echo "❌ Health check failed after 60 seconds"
if [ -f /tmp/health_response.html ]; then
  echo "--- Last response body ---"
  cat /tmp/health_response.html
  echo "--- End response body ---"
fi
exit 1
