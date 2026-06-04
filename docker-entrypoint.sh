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
envsubst '${WEB_PORT} ${API_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Validate nginx configuration
nginx -t

# ------------------------------------------
# Start all services via supervisord
# ------------------------------------------
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
