#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
NAMESPACE="${2:-messaging-dev}"
CONFIGMAP_NAME="${3:-messaging-env}"
SECRET_NAME="${4:-messaging-secret}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

# Keep sensitive values in Secret.
SECRET_KEYS=(
  AUTH_DB_USERNAME AUTH_DB_PASSWORD
  USER_DB_USERNAME USER_DB_PASSWORD
  DB_USERNAME DB_PASSWORD
  JWT_SECRET SESSION_SECRET SECRET_KEY
  SMTP_USER SMTP_PASSWORD
  GOOGLE_CLIENT_SECRET
  RABBITMQ_USER
  RABBITMQ_PASS
  BACKEND_RABBITMQ_PASS
  SOCKET_RABBITMQ_PASS
  CHAT_WORKER_RABBITMQ_PASS
  BACKEND_RABBITMQ_USER
  SOCKET_RABBITMQ_USER
  CHAT_WORKER_RABBITMQ_USER
  AUTH_DATABASE_URL USER_DB_URL BACKEND_DATABASE_URL
)

is_secret_key() {
  local key="$1"
  for sk in "${SECRET_KEYS[@]}"; do
    if [[ "$sk" == "$key" ]]; then
      return 0
    fi
  done
  return 1
}

require_key() {
  local key="$1"
  if [[ -z "${!key-}" ]]; then
    echo "missing required key in $ENV_FILE: $key" >&2
    exit 1
  fi
}

require_key AUTH_DB_USERNAME
require_key AUTH_DB_PASSWORD
require_key USER_DB_USERNAME
require_key USER_DB_PASSWORD
require_key DB_USERNAME
require_key DB_PASSWORD

AUTH_DB_HOST="${AUTH_DB_HOST:-auth-db}"
AUTH_DB_PORT="${AUTH_DB_PORT:-5432}"
AUTH_DB_NAME="${AUTH_DB_NAME:-auth_db}"

USER_DB_HOST="${USER_DB_HOST:-user-db}"
USER_DB_PORT="${USER_DB_PORT:-5432}"
USER_DB_NAME="${USER_DB_NAME:-users_db}"

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-messaging_db}"

AUTH_DATABASE_URL="${AUTH_DATABASE_URL:-postgres://${AUTH_DB_USERNAME}:${AUTH_DB_PASSWORD}@${AUTH_DB_HOST}:${AUTH_DB_PORT}/${AUTH_DB_NAME}}"
USER_DB_URL="${USER_DB_URL:-postgres://${USER_DB_USERNAME}:${USER_DB_PASSWORD}@${USER_DB_HOST}:${USER_DB_PORT}/${USER_DB_NAME}?sslmode=disable}"
BACKEND_DATABASE_URL="${BACKEND_DATABASE_URL:-postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable}"

CFG_FILE="$(mktemp)"
SEC_FILE="$(mktemp)"
trap 'rm -f "$CFG_FILE" "$SEC_FILE"' EXIT

while IFS= read -r key; do
  value="${!key-}"
  if is_secret_key "$key"; then
    printf '%s=%s\n' "$key" "$value" >> "$SEC_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$CFG_FILE"
  fi
done < <(awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' "$ENV_FILE" | sort -u)

printf 'AUTH_DATABASE_URL=%s\n' "$AUTH_DATABASE_URL" >> "$SEC_FILE"
printf 'USER_DB_URL=%s\n' "$USER_DB_URL" >> "$SEC_FILE"
printf 'BACKEND_DATABASE_URL=%s\n' "$BACKEND_DATABASE_URL" >> "$SEC_FILE"

kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

kubectl -n "$NAMESPACE" create configmap "$CONFIGMAP_NAME" \
  --from-env-file="$CFG_FILE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n "$NAMESPACE" create secret generic "$SECRET_NAME" \
  --from-env-file="$SEC_FILE" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "applied ConfigMap/$CONFIGMAP_NAME and Secret/$SECRET_NAME in namespace $NAMESPACE"
