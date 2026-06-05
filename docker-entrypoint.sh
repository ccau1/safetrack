#!/bin/bash
set -e

# ------------------------------------------
# Runtime defaults
# ------------------------------------------
export WEB_PORT=${WEB_PORT:-80}
export API_PORT=${API_PORT:-8080}
export NOTIFICATION_PORT=${NOTIFICATION_PORT:-8081}

# Spring Boot automatically maps SERVER_PORT -> server.port
export SERVER_PORT=${API_PORT}

# ------------------------------------------
# Generate nginx config from template
# ------------------------------------------
# Generate config from template, but respect read-only mounted configs (e.g. prod SSL)
if [ ! -f /etc/nginx/conf.d/default.conf ] || [ -w /etc/nginx/conf.d/default.conf ]; then
  envsubst '${WEB_PORT} ${API_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
fi

# Remove Debian/Ubuntu default site so our config is the default server
rm -f /etc/nginx/sites-enabled/default

# Validate nginx configuration
nginx -t

# ------------------------------------------
# Start all services via supervisord
# ------------------------------------------
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
