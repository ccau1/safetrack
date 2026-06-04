# Deploy Makefile — portable infrastructure & deployment commands
# =============================================================================
# Copy the entire deploy/ folder to any repo and use these commands.
# All project-specific values are derived automatically from the repo name
# or read from deploy/.env.
#
# Quick start:
#   cd deploy && make help
#   cd deploy && make ssh-key
#   cd deploy && make infra ENV=prod
# =============================================================================

DEPLOY_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
ROOT_DIR   := $(shell dirname $(DEPLOY_DIR))
PROJECT    := $(shell basename $(ROOT_DIR))
ENV        ?= prod

TF_DIR     := $(DEPLOY_DIR)/terraform/environments/$(ENV)
TFVARS     := $(TF_DIR)/terraform.tfvars

BLUE       := \033[36m
GREEN      := \033[32m
YELLOW     := \033[33m
RESET      := \033[0m

.PHONY: help ssh-key tf-init tf-plan tf-apply infra certs secrets deploy setup health

# ── Help ───────────────────────────────────────────────────────
help: ## Show all available commands
	@echo ""
	@echo "$(GREEN)Deploy Commands — Project: $(PROJECT)$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Environment variable: ENV=prod|staging|...$(RESET)"
	@echo ""

# ── SSH Key ────────────────────────────────────────────────────
ssh-key: ## Create or select SSH key for Terraform (interactive)
	@ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/select-ssh-key.sh

ssh-key-new: ## Create a fresh SSH key non-interactively
	@ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/create-ssh-key.sh

# ── Terraform ──────────────────────────────────────────────────
tf-init: ## Initialize Terraform (ENV=prod)
	@echo "$(GREEN)🔧 Initializing Terraform for env: $(ENV)$(RESET)"
	ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/tf-wrapper.sh init

tf-plan: ## Plan Terraform changes (ENV=prod)
	@echo "$(GREEN)📋 Planning Terraform for env: $(ENV)$(RESET)"
	ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/tf-wrapper.sh plan

tf-apply: ## Apply Terraform changes (ENV=prod)
	@echo "$(GREEN)🏗️  Applying Terraform for env: $(ENV)$(RESET)"
	ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/tf-wrapper.sh apply -auto-approve

# ── Full Workflows ─────────────────────────────────────────────
infra: ## Full apply + push certs + show secrets (ENV=prod)
	ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/apply.sh -auto-approve

certs: ## Push SSL certs to server (ENV=prod)
	ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/push-certs.sh

secrets: ## Show GitHub secrets from Terraform outputs (ENV=prod)
	ENV=$(ENV) PROJECT_NAME=$(PROJECT) $(DEPLOY_DIR)/scripts/github-secrets.sh

# ── App Deployment ─────────────────────────────────────────────
deploy: ## Deploy app to environment (reads deploy/.env for HOST, ENV, APP_IMAGE)
	@$(DEPLOY_DIR)/scripts/deploy.sh

setup: ## One-time server setup (Docker, Traefik, network)
	@$(DEPLOY_DIR)/scripts/setup-server.sh

health: ## Run health check (reads deploy/.env for HEALTH_URL)
	@$(DEPLOY_DIR)/scripts/health-check.sh
