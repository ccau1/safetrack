# Deploy

Centralized, portable deployment infrastructure. Copy this entire `deploy/` folder into any repo and it just works — project names, paths, and domains are derived automatically from the repo folder name or read from `deploy/.env`.

## What's Inside

```
deploy/
├── Makefile                    # Central command interface
├── .env.example                # Configuration template
├── docker-compose.{env}.yml    # Per-environment compose files
├── nginx.{env}.conf            # Per-environment nginx configs
├── scripts/
│   ├── setup-server.sh         # One-time server setup (idempotent)
│   ├── deploy.sh               # Deploy the app (idempotent)
│   ├── health-check.sh         # Verify the deployment
│   ├── select-ssh-key.sh       # Create/select SSH key for Terraform
│   ├── apply.sh                # Terraform apply + certs + secrets
│   ├── push-certs.sh           # Push SSL certs to server
│   └── github-secrets.sh       # Print GitHub secrets from TF outputs
└── terraform/
    └── environments/
        └── prod/               # Terraform per environment
```

## Quick Start

### 1. Configure

All project-specific settings live in one file:

```bash
cp deploy/.env.example deploy/.env
# Edit deploy/.env with your values
```

Key values to change when copying to another repo:

```bash
# Domains
DOMAIN_DEV=dev.yourdomain.com
DOMAIN_STAGING=staging.yourdomain.com
DOMAIN_PROD=yourdomain.com

# Server
HOST=your-server-ip

# Deployment target
ENV=staging
APP_IMAGE=ghcr.io/your-org/your-repo:staging
HEALTH_URL=https://staging.yourdomain.com
```

### 2. See all available commands

```bash
cd deploy && make help
```

### 3. Set up the server (one time)

```bash
cd deploy && make setup
```

This is **idempotent** — safe to run multiple times. It installs Docker, creates the shared network, and starts Traefik (for dev/staging).

### 4. Deploy

```bash
cd deploy && make deploy
```

This is also **idempotent** — running it again just restarts containers with the latest image.

### 5. Health check (optional)

```bash
cd deploy && make health
```

---

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make ssh-key` | Create or select SSH key for Terraform |
| `make tf-init ENV=prod` | Initialize Terraform for an environment |
| `make tf-plan ENV=prod` | Plan Terraform changes |
| `make tf-apply ENV=prod` | Apply Terraform changes |
| `make infra ENV=prod` | Full workflow: apply + push certs + show secrets |
| `make certs ENV=prod` | Push SSL certs to the server |
| `make secrets ENV=prod` | Print GitHub secrets from Terraform outputs |
| `make deploy` | Deploy app (reads `deploy/.env`) |
| `make setup` | One-time server setup |
| `make health` | Run health check |

**Environment variable:** All Terraform-related commands accept `ENV=prod|staging|...` to target different environments.

---

## Copying to Another Repo

To reuse this setup in a different project:

1. **Copy the folder:**
   ```bash
   cp -r deploy/ /path/to/other-repo/
   ```

2. **Create compose files** for your environments (`docker-compose.staging.yml`, etc.)

3. **Configure `.env`** and run:
   ```bash
   cd deploy && make setup
   cd deploy && make deploy
   ```

The scripts are completely generic — no hardcoded project names, domains, or paths. Everything is driven by `.env` or derived from the repo folder name.

---

## Script Reference

### `setup-server.sh`

Idempotent server preparation. Safe to run on a fresh or existing server.

**What it does:**
- Installs Docker if missing
- Creates the external Docker network (`dev`, `staging`, etc.)
- For `dev`/`staging`: copies Traefik configs and starts Traefik
- Does nothing if everything is already in place

**Required env:** `HOST`, `ENV`

### `deploy.sh`

Idempotent app deployment.

**What it does:**
- Copies `docker-compose.{ENV}.yml` and `nginx.{ENV}.conf` to the server
- Logs into GHCR (if `GHCR_TOKEN` is set)
- Pulls the image and restarts containers
- Prunes old images
- Runs a health check (if `HEALTH_URL` is set)

**Required env:** `HOST`, `ENV`, `APP_IMAGE`

### `health-check.sh`

Polls `HEALTH_URL` up to 12 times (60 seconds total).

**Required env:** `HEALTH_URL`

---

## Environment Differences

| Environment | Reverse Proxy | SSL | Network |
|-------------|---------------|-----|---------|
| `dev` | Traefik | Let's Encrypt | `dev` (external) |
| `staging` | Traefik | Let's Encrypt | `staging` (external) |
| `prod` | nginx (direct) | Cloudflare Origin CA | bridge |

- **Dev/Staging** share a server with Traefik. Each app container joins the external Docker network and gets auto-discovered via Traefik labels.
- **Prod** runs nginx directly on ports 80/443 with a Cloudflare Origin CA certificate. No Traefik needed.

---

## GitHub Actions Integration

The scripts are designed to work standalone, but they also pair well with CI. Example workflow step:

```yaml
- name: Deploy
  env:
    HOST: ${{ secrets.STAGING_HOST }}
    ENV: staging
    APP_IMAGE: ghcr.io/${{ github.repository }}:staging
    SSH_KEY: ${{ secrets.SSH_KEY }}
    GHCR_TOKEN: ${{ secrets.GH_TOKEN }}
  run: |
    echo "$SSH_KEY" > /tmp/deploy_key
    chmod 600 /tmp/deploy_key
    export SSH_KEY=/tmp/deploy_key
    ./deploy/scripts/deploy.sh
```

---

## Production Infrastructure (Terraform)

For prod, the server and DNS are managed by Terraform in `deploy/terraform/environments/prod/`.

📖 **See [`deploy/terraform/README.md`](terraform/README.md) for full Terraform docs:** environment structure, state isolation, adding new environments, and destroy safety.

Quick start below:

<details>
<summary>Original prod Terraform docs (click to expand)</summary>

### Prerequisites

- [Hetzner Cloud](https://console.hetzner.cloud/) account
- Terraform or OpenTofu installed locally
- An SSH key pair

### 1. Hetzner UI Setup (One-time)

1. Go to [console.hetzner.cloud](https://console.hetzner.cloud/)
2. Create a new project
3. Navigate to **Security → API Tokens**
4. Generate a token with **Read & Write** permissions

### 2. Create the Server with Terraform

```bash
cd deploy
make ssh-key          # Create/select SSH key
make tf-init ENV=prod
make tf-plan ENV=prod
make infra ENV=prod   # apply + push certs + show secrets
```

Or step by step:

```bash
cd deploy/terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars and add your tokens

terraform init
cd ../../../
make infra ENV=prod
```

### 3. SSL Certificate Setup (Cloudflare Origin CA)

Terraform creates the certificate automatically. To push certs manually:

```bash
cd deploy && make certs ENV=prod
```

Then set Cloudflare SSL/TLS mode to **"Full (strict)"**.

### 4. GitHub Secrets

| Secret | Required | Value |
|--------|----------|-------|
| `HETZNER_HOST` | ✅ | Server IP |
| `HETZNER_USER` | ✅ | `root` |
| `HETZNER_SSH_KEY` | ✅ | Private SSH key |
| `ENV_FILE` | ✅ | Empty for static sites |
| `GH_TOKEN` | ✅ | GitHub Classic PAT (`read:packages`) |
| `CF_ORIGIN_CERT` | ⬜ | Cloudflare Origin CA cert |
| `CF_ORIGIN_KEY` | ⬜ | Cloudflare Origin CA key |

### 5. First Deploy

Push to `main` or trigger the workflow manually.

</details>
