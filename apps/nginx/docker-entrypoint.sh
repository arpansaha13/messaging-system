#!/bin/sh
set -e

# Determine environment and setup appropriate nginx config
if [ "$ENVIRONMENT" = "production" ]; then
    # For production, substitute environment variables in template
    envsubst '${NGINX_DOMAIN_NAME}' < /etc/nginx/nginx.prod.conf.template > /etc/nginx/nginx.conf
fi

# Execute nginx or the passed command
exec "$@"
