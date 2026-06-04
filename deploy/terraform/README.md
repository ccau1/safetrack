# Deploy Terraform

Infrastructure-as-code for the **production** environment (Hetzner Cloud server + Cloudflare DNS + Origin CA certificates).

## Philosophy: One Folder Per Environment

Each environment lives in its own folder with its own **isolated Terraform state file**.

```
deploy/terraform/
└── environments/
    └── prod/                 # ← current production environment
        ├── main.tf
        ├── terraform.tfstate # isolated state — destroy here only hits prod
        ├── terraform.tfvars
        └── ssl/
```

This guarantees that `terraform destroy` in `environments/prod/` only destroys production resources.

---

## Quick Start

```bash
cd deploy/terraform/environments/prod

# 1. Configure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Hetzner + Cloudflare tokens

# 2. Initialize
terraform init

# 3. Preview
terraform plan

# 4. Apply
terraform apply
```

### Helper scripts (from repo root)

```bash
# Apply + push certs + print GitHub secrets
make infra

# Just push SSL certs to the server
make certs

# Print GitHub secrets
make secrets
```

---

## Destroying an Environment

**Because state is isolated per folder, destruction is scoped to that environment only:**

```bash
# Destroy ONLY production
cd deploy/terraform/environments/prod
terraform destroy
```

You would never accidentally destroy dev/staging from here — they live in their own separate repositories with isolated state files.

---

## Adding a New Environment

If you later need a second prod-like environment (e.g. `prod-eu`, `prod-us`, or a `staging` clone under deploy):

```bash
cd deploy/terraform/environments
cp -r prod staging    # or prod-eu, etc.
cd staging

# Edit terraform.tfvars with different values (server name, DNS records, etc.)
# Edit main.tf if resource names need to change

terraform init
terraform apply
```

Each new folder gets its own state file automatically. They are completely independent.

---

## State & Backend

Currently using **local state** (`terraform.tfstate` inside each environment folder).

If you switch to a remote backend (S3, Terraform Cloud, Hetzner Object Storage, etc.), add the backend block to each environment's `terraform.tf` with a unique key per environment:

```hcl
terraform {
  backend "s3" {
    bucket = "my-tf-state"
    key    = "deploy/prod/terraform.tfstate"   # unique per env
    region = "eu-central-1"
  }
}
```

This ensures dev, staging, and prod states remain isolated even with remote storage.

---

## What's Created

| Resource | Purpose |
|----------|---------|
| `hcloud_server.app` | Hetzner Cloud server (`safetrack`) |
| `hcloud_firewall.web` | Firewall allowing 22, 80, 443 |
| `hcloud_ssh_key.deploy` | SSH key for server access |
| `cloudflare_record.app` | DNS A record for `tribalorigin.com` |
| `cloudflare_origin_ca_certificate.app` | Cloudflare Origin CA certificate |
| `local_file.app_cert` / `app_key` | Writes cert + key to `./ssl/` |

---

## File Reference

| File | Purpose |
|------|---------|
| `main.tf` | Resource definitions |
| `variables.tf` | Input variables |
| `outputs.tf` | Server IP, cert outputs, next-steps guide |
| `terraform.tf` | Provider versions & provider config |
| `terraform.tfvars` | Your secrets & overrides (gitignored) |
| `terraform.tfvars.example` | Template for `terraform.tfvars` |
| `ssl/` | Generated Cloudflare Origin CA cert + key (gitignored) |
