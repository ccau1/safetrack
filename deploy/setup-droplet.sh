#!/bin/bash
set -e

PROJECT_NAME="${PROJECT_NAME:-$(basename "$(dirname "$PWD")")}"
echo "=== ${PROJECT_NAME} Droplet Setup ==="

# Update system
apt-get update && apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# Create app directory
APP_DIR="/opt/${PROJECT_NAME}"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repo (adjust if you deploy via SCP/GitHub instead)
if [ ! -d ".git" ]; then
    echo "Please clone your repository into $APP_DIR"
    echo "Example: git clone https://github.com/yourname/${PROJECT_NAME}.git ."
    exit 1
fi

# Create production env file if missing
if [ ! -f "deploy/.env" ]; then
    cat > deploy/.env << 'EOF'
# Add any runtime environment variables here if needed
EOF
    echo "Created deploy/.env — add values if your app needs them"
fi

# Start services
cd deploy
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

echo "=== Setup complete ==="
echo "App should be available at http://$(curl -s ifconfig.me)"
