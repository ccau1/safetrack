#!/bin/bash
set -e

# =============================================================================
# Terraform Wrapper — sources deploy/.env and exports TF_VAR_* variables
# =============================================================================
# Usage: ENV=prod ./tf-wrapper.sh <terraform-command> [args...]
#
# This script reads deploy/.env and automatically exports variables
# with the TF_VAR_ prefix so Terraform picks them up as input vars.
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

# ── Export Terraform variables from .env ───────────────────────

# Required
export TF_VAR_hcloud_token="${HCLOUD_TOKEN:-}"

# Optional / with defaults
export TF_VAR_cloudflare_api_token="${CLOUDFLARE_API_TOKEN:-}"
export TF_VAR_cloudflare_zone_id="${CLOUDFLARE_ZONE_ID:-}"
export TF_VAR_cloudflare_proxied="${CLOUDFLARE_PROXIED:-true}"

# Derive SSH public key path from SSH_KEY, expanding ~
SSH_KEY_PATH="${SSH_KEY:-$HOME/.ssh/${PROJECT_NAME}-deploy}"
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
export TF_VAR_ssh_public_key_path="${SSH_KEY_PATH}.pub"

# ── Validation ─────────────────────────────────────────────────
if [ -z "$TF_VAR_hcloud_token" ]; then
  echo "❌ HCLOUD_TOKEN is not set. Add it to deploy/.env"
  exit 1
fi

if [ ! -f "$TF_VAR_ssh_public_key_path" ]; then
  echo "❌ SSH public key not found: $TF_VAR_ssh_public_key_path"
  echo "   Generate one with: cd deploy && make ssh-key-new"
  exit 1
fi

TF_DIR="$DEPLOY_DIR/terraform/environments/$ENV"

if [ ! -d "$TF_DIR" ]; then
  echo "❌ Terraform environment not found: $TF_DIR"
  exit 1
fi

cd "$TF_DIR"
terraform "$@"
