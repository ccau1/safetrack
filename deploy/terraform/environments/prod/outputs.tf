output "server_ip" {
  description = "Public IPv4 address of the Hetzner server"
  value       = hcloud_server.app.ipv4_address
}

output "server_id" {
  description = "ID of the created server (for CLI reference)"
  value       = hcloud_server.app.id
}

output "domains" {
  description = "DNS records created in Cloudflare"
  value = var.cloudflare_zone_id != "" ? [
    "safetrack.tribalorigin.com",
  ] : []
}

output "origin_certificate" {
  description = "Cloudflare Origin CA certificate (PEM). Saved to ssl/cloudflare-origin.pem"
  value       = var.cloudflare_zone_id != "" ? cloudflare_origin_ca_certificate.app[0].certificate : ""
  sensitive   = false
}

output "origin_private_key" {
  description = "Private key for the Origin CA certificate (PEM). Saved to ssl/cloudflare-origin.key"
  value       = var.cloudflare_zone_id != "" ? tls_private_key.app[0].private_key_pem : ""
  sensitive   = true
}

output "next_steps" {
  description = "Post-apply instructions"
  value       = <<-EOT

  ✅ Terraform applied successfully!

  ── 1. Extract SSL certificate ───────────────────────────────

     mkdir -p ssl
     terraform output -raw origin_certificate > ssl/cloudflare-origin.pem
     terraform output -raw origin_private_key > ssl/cloudflare-origin.key
     chmod 600 ssl/cloudflare-origin.key

  ── 2. Set Cloudflare SSL/TLS mode ───────────────────────────

     Go to: https://dash.cloudflare.com → tribalorigin.com → SSL/TLS → Overview
     Set to: "Full (strict)"

  ── 3. Add GitHub Secrets ────────────────────────────────────

     Required:
       HETZNER_HOST = ${hcloud_server.app.ipv4_address}
       HETZNER_USER = root
       HETZNER_SSH_KEY = <your private SSH key>
       ENV_FILE = <app runtime env vars (JWT_SECRET, DB_URL, SMTP_*, etc.)>
       GH_TOKEN = <GitHub classic PAT with read:packages>

     Optional (auto-deploy certs in CI):
       CF_ORIGIN_CERT = <contents of ssl/cloudflare-origin.pem>
       CF_ORIGIN_KEY = <contents of ssl/cloudflare-origin.key>

     Optional (only for Terraform-in-CI):
       HCLOUD_TOKEN = <your Hetzner API token>

  ── 4. Deploy ───────────────────────────────────────────────

     git push origin main

  EOT
}
