#!/bin/bash
set -e

# =============================================================================
# CONFIG — Edit deploy/.env or set env vars to override defaults
# =============================================================================
# ENV              Terraform environment (default: prod)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Remember explicitly passed env vars before .env can override them
__ENV="${ENV:-}"

# Source .env if present
if [ -f "$DEPLOY_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$DEPLOY_DIR/.env"
  set +a
fi

# Restore explicitly passed values (command-line / parent process overrides .env)
[ -n "$__ENV" ] && ENV="$__ENV"

ENV="${ENV:-prod}"
TF_DIR="$DEPLOY_DIR/terraform/environments/$ENV"

if [ ! -d "$TF_DIR" ]; then
  echo "❌ Terraform environment not found: $TF_DIR"
  exit 1
fi

cd "$TF_DIR"

SERVER_IP=$(terraform output -raw server_ip)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  GitHub Secrets — copy-paste into:"
echo "  Settings → Secrets and variables → Actions → New repository secret"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Required secrets (5):"
echo ""

# HETZNER_HOST
echo "──────────── HETZNER_HOST ─────────────────────────────────────"
echo "$SERVER_IP"
echo ""

# HETZNER_USER
echo "──────────── HETZNER_USER ─────────────────────────────────────"
echo "root"
echo ""

# HETZNER_SSH_KEY
# Derive private key path from .env SSH_KEY or terraform.tfvars
PUB_KEY=$(grep "^ssh_public_key_path" "$TF_DIR/terraform.tfvars" 2>/dev/null | sed -E 's/.*= *"(.+)".*/\1/' || true)
if [ -z "$PUB_KEY" ] && [ -n "$SSH_KEY" ]; then
  PUB_KEY="${SSH_KEY}.pub"
fi
DERIVED_PRIV="${PUB_KEY%.pub}"
echo "──────────── HETZNER_SSH_KEY ──────────────────────────────────"
echo "Paste your private SSH key here."
if [ -n "$DERIVED_PRIV" ] && [ -f "$DERIVED_PRIV" ]; then
  echo "File: $DERIVED_PRIV"
else
  echo "File: ~/.ssh/id_ed25519 (or whatever key you used for Terraform)"
fi
echo ""

# GH_TOKEN
echo "──────────── GH_TOKEN ─────────────────────────────────────────"
echo "Create a Classic PAT: https://github.com/settings/tokens/new?type=classic"
echo "Required scope: read:packages"
echo ""

# ENV_FILE
echo "──────────── ENV_FILE ─────────────────────────────────────────"
echo "Runtime environment variables for the SafeTrack app."
echo "Include: JWT_SECRET, SPRING_DATASOURCE_URL (or DB_*), SMTP_*,"
echo "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AZURE_CLIENT_ID, etc."
echo ""

echo ""
echo "Optional secrets (3):"
echo ""

# CF_ORIGIN_CERT
echo "──────────── CF_ORIGIN_CERT (optional) ────────────────────────"
echo "If you set this, the deploy workflow will auto-copy certs to the server."
echo "If you skip it, you must manually SCP certs once (see deploy/README.md)."
echo ""
terraform output -raw origin_certificate
echo ""

# CF_ORIGIN_KEY
echo "──────────── CF_ORIGIN_KEY (optional) ─────────────────────────"
echo ""
terraform output -raw origin_private_key
echo ""

# HCLOUD_TOKEN
echo "──────────── HCLOUD_TOKEN (optional) ──────────────────────────"
echo "Not needed for app deploys. Only required if you run Terraform in CI."
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
