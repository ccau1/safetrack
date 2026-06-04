#!/bin/bash
set -e

# =============================================================================
# CONFIG — Edit deploy/.env or set env vars to override defaults
# =============================================================================
# ENV              Terraform environment (default: prod)
# PROJECT_NAME     Project name for remote paths (default: repo folder name)
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

if [ ! -d "$TF_DIR" ]; then
  echo "❌ Terraform environment not found: $TF_DIR"
  echo "   Create it first: cp -r $DEPLOY_DIR/terraform/environments/prod $TF_DIR"
  exit 1
fi

# Derive expected SSH public key path from .env / repo name
SSH_KEY_PATH="${SSH_KEY:-$HOME/.ssh/${PROJECT_NAME}-deploy}"
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}.pub"

# Check if terraform.tfvars has a key configured
TFVARS="$TF_DIR/terraform.tfvars"
TFVARS_KEY=""
if [ -f "$TFVARS" ]; then
  TFVARS_KEY=$(grep "^ssh_public_key_path" "$TFVARS" 2>/dev/null | sed -E 's/.*= *"(.+)".*/\1/' || true)
fi

# Skip interactive key selection if a valid key is already configured
if [ -n "$TFVARS_KEY" ] && [ -f "$TFVARS_KEY" ]; then
  echo "🔑 Using existing SSH key from terraform.tfvars: $TFVARS_KEY"
elif [ -f "$SSH_KEY_PATH" ]; then
  echo "🔑 Using existing SSH key: $SSH_KEY_PATH"
else
  "$SCRIPT_DIR/select-ssh-key.sh"
fi

echo ""
echo "🏗️  Running terraform apply for env: $ENV ..."
ENV="$ENV" PROJECT_NAME="$PROJECT_NAME" "$SCRIPT_DIR/tf-wrapper.sh" apply "$@"

echo ""
ENV="$ENV" PROJECT_NAME="$PROJECT_NAME" "$SCRIPT_DIR/push-certs.sh"

echo ""
ENV="$ENV" PROJECT_NAME="$PROJECT_NAME" "$SCRIPT_DIR/github-secrets.sh"
