#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$DEPLOY_DIR")"

# Remember explicitly passed env vars before .env can override them
__HOST="${HOST:-}"
__USER="${USER:-}"
__ENV="${ENV:-}"
__APP_IMAGE="${APP_IMAGE:-}"
__SSH_KEY="${SSH_KEY:-}"
__PROJECT_NAME="${PROJECT_NAME:-}"
__HEALTH_URL="${HEALTH_URL:-}"
__GHCR_USER="${GHCR_USER:-}"
__GHCR_TOKEN="${GHCR_TOKEN:-}"

# Load .env if present
if [ -f "$DEPLOY_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$DEPLOY_DIR/.env"
  set +a
fi

# Restore explicitly passed values (command-line / parent process overrides .env)
[ -n "$__HOST" ] && HOST="$__HOST"
[ -n "$__USER" ] && USER="$__USER"
[ -n "$__ENV" ] && ENV="$__ENV"
[ -n "$__APP_IMAGE" ] && APP_IMAGE="$__APP_IMAGE"
[ -n "$__SSH_KEY" ] && SSH_KEY="$__SSH_KEY"
[ -n "$__PROJECT_NAME" ] && PROJECT_NAME="$__PROJECT_NAME"
[ -n "$__HEALTH_URL" ] && HEALTH_URL="$__HEALTH_URL"
[ -n "$__GHCR_USER" ] && GHCR_USER="$__GHCR_USER"
[ -n "$__GHCR_TOKEN" ] && GHCR_TOKEN="$__GHCR_TOKEN"

HOST="${HOST:-}"
USER="${USER:-root}"
ENV="${ENV:-}"
APP_IMAGE="${APP_IMAGE:-}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
PROJECT_NAME="${PROJECT_NAME:-$(basename "$ROOT_DIR")}"
HEALTH_URL="${HEALTH_URL:-}"
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

# ── Validation ─────────────────────────────────────────────────
[ -n "$HOST" ] || { echo "❌ HOST is required (set in deploy/.env or env)"; exit 1; }
[ -n "$ENV" ]   || { echo "❌ ENV is required (set in deploy/.env or env)"; exit 1; }
[ -n "$APP_IMAGE" ] || { echo "❌ APP_IMAGE is required (set in deploy/.env or env)"; exit 1; }

COMPOSE_FILE="docker-compose.${ENV}.yml"
[ -f "$DEPLOY_DIR/$COMPOSE_FILE" ] || { echo "❌ $COMPOSE_FILE not found in deploy/"; exit 1; }

REMOTE_DIR="/opt/${PROJECT_NAME}-${ENV}"
NGINX_CONF="nginx.${ENV}.conf"
[ -f "$DEPLOY_DIR/$NGINX_CONF" ] || NGINX_CONF="nginx.dev.conf"
[ -f "$DEPLOY_DIR/$NGINX_CONF" ] || { echo "❌ No nginx config found for $ENV"; exit 1; }

echo "🚀 Deploying ${PROJECT_NAME} (${ENV}) to ${HOST}"
echo "   Image:     ${APP_IMAGE}"
echo "   Remote:    ${REMOTE_DIR}"
echo "   Compose:   ${COMPOSE_FILE}"
echo "   Nginx:     ${NGINX_CONF}"

# ── Clear stale host key ───────────────────────────────────────
ssh-keygen -R "$HOST" 2>/dev/null || true

# ── Ensure remote directory exists ─────────────────────────────
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "${USER}@${HOST}" "mkdir -p ${REMOTE_DIR}"

# ── Copy files ─────────────────────────────────────────────────
echo "📤 Copying compose file and nginx config..."
SCP_ARGS=("$DEPLOY_DIR/${COMPOSE_FILE}" "$DEPLOY_DIR/${NGINX_CONF}")

# Also copy .env if it exists locally
if [ -f "$DEPLOY_DIR/.env" ]; then
  SCP_ARGS+=("$DEPLOY_DIR/.env")
fi

scp -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new \
  "${SCP_ARGS[@]}" \
  "${USER}@${HOST}:${REMOTE_DIR}/"

# ── Deploy ─────────────────────────────────────────────────────
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" << REMOTE_SCRIPT
  set -e
  cd "${REMOTE_DIR}"

  # Login to GHCR if credentials provided
  if [ -n "${GHCR_TOKEN}" ]; then
    echo "🔑 Logging into GHCR..."
    echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER:-}" --password-stdin
  fi

  echo "📦 Pulling image and restarting containers..."
  export APP_IMAGE="${APP_IMAGE}"
  docker compose -f "${COMPOSE_FILE}" pull
  docker compose -f "${COMPOSE_FILE}" up -d

  echo "🧹 Pruning old images..."
  docker image prune -af --filter "until=168h" >/dev/null 2>&1 || true
  docker system prune -f >/dev/null 2>&1 || true

  echo ""
  echo "✅ Deployed successfully"
  docker compose -f "${COMPOSE_FILE}" ps
REMOTE_SCRIPT

# ── Health Check ───────────────────────────────────────────────
if [ -n "$HEALTH_URL" ]; then
  echo ""
  echo "🩺 Health check: ${HEALTH_URL}"
  for i in {1..12}; do
    sleep 5
    if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
      echo "✅ Health check passed"
      exit 0
    fi
    echo "   Attempt ${i}/12..."
  done
  echo "❌ Health check failed after 60 seconds"
  exit 1
fi
