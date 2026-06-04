#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Remember explicitly passed env vars before .env can override them
__HOST="${HOST:-}"
__USER="${USER:-}"
__ENV="${ENV:-}"
__SSH_KEY="${SSH_KEY:-}"
__ACME_EMAIL="${ACME_EMAIL:-}"

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
[ -n "$__SSH_KEY" ] && SSH_KEY="$__SSH_KEY"
[ -n "$__ACME_EMAIL" ] && ACME_EMAIL="$__ACME_EMAIL"

HOST="${HOST:-}"
USER="${USER:-root}"
ENV="${ENV:-}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
ACME_EMAIL="${ACME_EMAIL:-admin@example.com}"

# ── Validation ─────────────────────────────────────────────────
[ -n "$HOST" ] || { echo "❌ HOST is required (set in deploy/.env or env)"; exit 1; }
[ -n "$ENV" ]   || { echo "❌ ENV is required (set in deploy/.env or env)"; exit 1; }

NETWORK_NAME="$ENV"

echo "🔧 Setting up server ${HOST} for environment: ${ENV}"

# ── Clear stale host key ───────────────────────────────────────
ssh-keygen -R "$HOST" 2>/dev/null || true

# ── Server setup ───────────────────────────────────────────────
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "${USER}@${HOST}" << REMOTE_SCRIPT
  set -e

  # Install Docker if missing
  if ! command -v docker >/dev/null 2>&1; then
    echo "📦 Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker "${USER}"
    systemctl enable --now docker
    echo "✅ Docker installed"
  else
    echo "✅ Docker already installed"
  fi

  # Create external Docker network if missing
  if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}\$"; then
    echo "🌐 Creating Docker network: ${NETWORK_NAME}"
    docker network create "${NETWORK_NAME}"
  else
    echo "✅ Docker network '${NETWORK_NAME}' already exists"
  fi

  # Setup Traefik for dev/staging
  if [ "${ENV}" != "prod" ]; then
    TRAEFIK_DIR="/opt/traefik"
    mkdir -p \${TRAEFIK_DIR}/letsencrypt

    if docker ps --format '{{.Names}}' | grep -q '^traefik\$'; then
      echo "✅ Traefik already running"
    else
      echo "🚀 Traefik not running. Setting up..."

      # We will copy config from local deploy/traefik/ in the next step
      echo "   (Waiting for config from local machine...)"
    fi
  fi
REMOTE_SCRIPT

# ── Copy Traefik config for dev/staging ────────────────────────
if [ "$ENV" != "prod" ]; then
  TRAEFIK_LOCAL="$DEPLOY_DIR/traefik"
  if [ ! -d "$TRAEFIK_LOCAL" ]; then
    echo "⚠️  deploy/traefik/ not found. Skipping Traefik setup."
    echo "   For dev/staging, create deploy/traefik/ with docker-compose.yml and traefik.yml"
    exit 0
  fi

  echo "📤 Copying Traefik config to ${HOST}..."

  # Create a temp dir to render configs
  TMPDIR=$(mktemp -d)
  cp "$TRAEFIK_LOCAL/"*.yml "$TMPDIR/" 2>/dev/null || true

  # Substitute placeholders
  for f in "$TMPDIR/"*.yml; do
    [ -f "$f" ] || continue
    sed -i.bak \
      -e "s|__NETWORK__|${NETWORK_NAME}|g" \
      -e "s|__ACME_EMAIL__|${ACME_EMAIL}|g" \
      "$f"
    rm -f "${f}.bak"
  done

  scp -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new \
    "$TMPDIR/"*.yml \
    "${USER}@${HOST}:/opt/traefik/"

  rm -rf "$TMPDIR"

  # Start Traefik
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" << REMOTE_SCRIPT
    set -e
    cd /opt/traefik

    # Determine compose file name
    COMPOSE_FILE="docker-compose.yml"
    if [ -f "docker-compose.${ENV}.yml" ]; then
      COMPOSE_FILE="docker-compose.${ENV}.yml"
    fi

    if [ ! -f "\${COMPOSE_FILE}" ]; then
      echo "❌ Traefik compose file not found: \${COMPOSE_FILE}"
      exit 1
    fi

    echo "🚀 Starting Traefik with \${COMPOSE_FILE}..."
    docker compose -f "\${COMPOSE_FILE}" up -d

    echo "✅ Traefik setup complete"
    docker ps --filter name=traefik --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
REMOTE_SCRIPT
fi

echo ""
echo "✅ Server setup complete for ${ENV}"
