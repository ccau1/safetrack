#!/bin/bash
set -e

# =============================================================================
# Non-interactive SSH key creation for Terraform
# =============================================================================
# Creates a new ed25519 key named {PROJECT_NAME}-deploy and updates
# terraform.tfvars automatically. Use this when you want a fresh key.
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
TFVARS="$TF_DIR/terraform.tfvars"

KEY_NAME="${PROJECT_NAME}-deploy"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

# Ensure tfvars exists
if [ ! -f "$TFVARS" ]; then
  if [ -f "$TFVARS.example" ]; then
    cp "$TFVARS.example" "$TFVARS"
  else
    echo "❌ Terraform vars file not found: $TFVARS"
    exit 1
  fi
fi

# Check if key already exists
if [ -f "$KEY_PATH" ] || [ -f "$KEY_PATH.pub" ]; then
  echo "⚠️  Key already exists: $KEY_PATH"
  read -rp "Overwrite? [y/N]: " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
  fi
  rm -f "$KEY_PATH" "$KEY_PATH.pub"
fi

echo "🔑 Generating ed25519 key pair: $KEY_PATH"
ssh-keygen -t ed25519 -C "deploy@${PROJECT_NAME}" -f "$KEY_PATH" -N ""

# Update terraform.tfvars
if grep -q "^ssh_public_key_path" "$TFVARS" 2>/dev/null; then
  sed -i '' -E "s|^ssh_public_key_path.*|ssh_public_key_path = \"$KEY_PATH.pub\"|" "$TFVARS"
else
  echo "" >> "$TFVARS"
  echo "ssh_public_key_path = \"$KEY_PATH.pub\"" >> "$TFVARS"
fi

echo ""
echo "✅ Created: $KEY_PATH.pub"
echo "📝 Updated $TFVARS"
echo "   ssh_public_key_path = \"$KEY_PATH.pub\""
