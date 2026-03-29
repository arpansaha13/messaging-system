#!/bin/sh
set -eu

require_var() {
  name="$1"
  val="$(eval "printf '%s' \"\${$name-}\"")"
  if [ -z "$val" ]; then
    echo "ERROR: $name is required for RabbitMQ definitions rendering" >&2
    exit 1
  fi
}

for var in \
  RABBITMQ_USER RABBITMQ_PASS \
  BACKEND_RABBITMQ_USER BACKEND_RABBITMQ_PASS \
  SOCKET_RABBITMQ_USER SOCKET_RABBITMQ_PASS \
  CHAT_WORKER_RABBITMQ_USER CHAT_WORKER_RABBITMQ_PASS
do
  require_var "$var"
done

envsubst < /etc/rabbitmq/definitions.json.tpl > /etc/rabbitmq/definitions.json

exec /usr/local/bin/docker-entrypoint.sh "$@"
