resource "hcloud_ssh_key" "deploy" {
  name       = "safetrack-deploy"
  public_key = file(var.ssh_public_key_path)
}

resource "hcloud_firewall" "web" {
  name = "safetrack-firewall"

  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "SSH"
  }

  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "HTTP"
  }

  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "HTTPS"
  }
}

resource "hcloud_server" "app" {
  name         = "safetrack"
  server_type  = var.server_type
  image        = "ubuntu-24.04"
  location     = var.location
  ssh_keys     = [hcloud_ssh_key.deploy.id]
  firewall_ids = [hcloud_firewall.web.id]
  backups      = var.enable_backups

  labels = {
    app = "safetrack"
  }

  # Bootstrap Docker and create app directory
  user_data = <<-EOF
    #cloud-config
    package_update: true
    packages:
      - fail2ban
    runcmd:
      - curl -fsSL https://get.docker.com | sh
      - usermod -aG docker root
      - mkdir -p /opt/safetrack
      - systemctl enable --now docker
  EOF
}

# ── Cloudflare DNS Records ─────────────────────────────────────

resource "cloudflare_record" "app" {
  count = var.cloudflare_zone_id != "" ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "safetrack"
  type    = "A"
  content = hcloud_server.app.ipv4_address
  ttl     = 1
  proxied = var.cloudflare_proxied
}

# ── Cloudflare Origin CA Certificate ───────────────────────────

resource "tls_private_key" "app" {
  count = var.cloudflare_zone_id != "" ? 1 : 0

  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "app" {
  count = var.cloudflare_zone_id != "" ? 1 : 0

  private_key_pem = tls_private_key.app[0].private_key_pem

  subject {
    common_name = "safetrack.tribalorigin.com"
  }
}

resource "cloudflare_origin_ca_certificate" "app" {
  count = var.cloudflare_zone_id != "" ? 1 : 0

  csr                = tls_cert_request.app[0].cert_request_pem
  hostnames          = ["safetrack.tribalorigin.com"]
  request_type       = "origin-rsa"
  requested_validity = 5475 # 15 years
}

# Write certificate files locally after creation
resource "local_file" "app_cert" {
  count = var.cloudflare_zone_id != "" ? 1 : 0

  content         = cloudflare_origin_ca_certificate.app[0].certificate
  filename        = "${path.module}/ssl/cloudflare-origin.pem"
  file_permission = "0644"
}

resource "local_file" "app_key" {
  count = var.cloudflare_zone_id != "" ? 1 : 0

  content         = tls_private_key.app[0].private_key_pem
  filename        = "${path.module}/ssl/cloudflare-origin.key"
  file_permission = "0600"
}
