#!/bin/bash
set -e

# =============================================================================
# CONFIG — Edit deploy/.env or set env vars to override defaults
# =============================================================================
# ENV              Terraform environment (default: prod)
# PROJECT_NAME     Project name for remote SSL path (default: repo folder name)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$DEPLOY_DIR")"

# Remember explicitly passed env vars before .env can override them
__ENV="${ENV:-}"
__PROJECT_NAME="${PROJECT_NAME:-}"

# Source .env if present
if [ -f "$DEPLOY_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$DEPLOY_DIR/.env"
  set +a
fi

# Restore explicitly passed values (command-line / parent process overrides .env)
[ -n "$__ENV" ] && ENV="$__ENV"
[ -n "$__PROJECT_NAME" ] && PROJECT_NAME="$__PROJECT_NAME"

ENV="${ENV:-prod}"
PROJECT_NAME="${PROJECT_NAME:-$(basename "$ROOT_DIR")}"
TF_DIR="$DEPLOY_DIR/terraform/environments/$ENV"
SSL_DIR="$TF_DIR/ssl"

# Read the public key path from terraform.tfvars, derive private key path
TFVARS="$TF_DIR/terraform.tfvars"
if [ -f "$TFVARS" ] && grep -q "^ssh_public_key_path" "$TFVARS" 2>/dev/null; then
  PUB_KEY=$(grep "^ssh_public_key_path" "$TFVARS" | sed -E 's/.*= *"(.+)".*/\1/')
  DERIVED_PRIV="${PUB_KEY%.pub}"
else
  DERIVED_PRIV="$HOME/.ssh/id_ed25519"
fi

SSH_KEY="${SSH_KEY:-$DERIVED_PRIV}"

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH private key not found: $SSH_KEY"
    echo "   Options:"
    echo "   1. Set SSH_KEY env var: SSH_KEY=~/.ssh/my-key ./deploy/scripts/push-certs.sh"
    echo "   2. Update ssh_public_key_path in deploy/terraform/environments/${ENV}/terraform.tfvars"
    exit 1
fi

echo "🔑 Using SSH key: $SSH_KEY"

cd "$TF_DIR"

SERVER_IP=$(terraform output -raw server_ip)

# Clear stale host key (server may have been recreated with same IP)
ssh-keygen -R "$SERVER_IP" 2>/dev/null || true

echo ""
echo "⏳ Waiting for SSH on root@$SERVER_IP ..."
SSH_READY=false
for i in {1..30}; do
  if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -o BatchMode=yes "root@$SERVER_IP" "echo ready" >/dev/null 2>&1; then
    echo "✅ SSH is ready"
    SSH_READY=true
    break
  fi
  echo "   Attempt $i/30: not ready, waiting 5s..."
  sleep 5
done

if [ "$SSH_READY" != "true" ]; then
  echo "❌ SSH never became ready after 150 seconds"
  exit 1
fi

echo ""
echo "📤 Extracting SSL certificates from Terraform outputs..."
mkdir -p "$SSL_DIR"
terraform output -raw origin_certificate > "$SSL_DIR/cloudflare-origin.pem"
terraform output -raw origin_private_key > "$SSL_DIR/cloudflare-origin.key"
chmod 600 "$SSL_DIR/cloudflare-origin.key"

REMOTE_SSL_DIR="/opt/${PROJECT_NAME}/ssl"
echo ""
echo "🚀 Pushing certs to root@$SERVER_IP:${REMOTE_SSL_DIR}/ ..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "root@$SERVER_IP" "mkdir -p ${REMOTE_SSL_DIR}"
scp -i "$SSH_KEY" "$SSL_DIR/cloudflare-origin.pem" "$SSL_DIR/cloudflare-origin.key" "root@$SERVER_IP:${REMOTE_SSL_DIR}/"
ssh -i "$SSH_KEY" "root@$SERVER_IP" "chmod 600 ${REMOTE_SSL_DIR}/cloudflare-origin.key && chmod 644 ${REMOTE_SSL_DIR}/cloudflare-origin.pem"

echo ""
echo "✅ Certificates deployed successfully!"
