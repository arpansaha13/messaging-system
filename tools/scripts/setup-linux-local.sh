#!/usr/bin/env bash
set -euo pipefail

# Optional local setup for non-containerized development.
# Use this only if you do NOT want to run infrastructure via containers.

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
elif command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
elif command -v doas >/dev/null 2>&1; then
  SUDO="doas"
else
  echo "This script requires root privileges. Run as root, or install sudo/doas."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This script currently supports Debian/Ubuntu Linux only (apt-get required)."
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_ROOT="${REPO_ROOT}/data/dev"

mkdir -p "${DATA_ROOT}/auth" "${DATA_ROOT}/user" "${DATA_ROOT}/default"

echo "Installing local infra packages (PostgreSQL, RabbitMQ, Memcached)..."
MISSING_PKGS=()
for pkg in postgresql postgresql-contrib rabbitmq-server memcached; do
  if ! dpkg -s "$pkg" >/dev/null 2>&1; then
    MISSING_PKGS+=("$pkg")
  fi
done

if [[ ${#MISSING_PKGS[@]} -gt 0 ]]; then
  echo "Missing packages: ${MISSING_PKGS[*]}"
  ${SUDO} apt-get update
  ${SUDO} apt-get install -y "${MISSING_PKGS[@]}"
else
  echo "All required local infra packages already installed, skipping apt install."
fi

PG_VERSION="$(psql -V | awk '{print $3}' | cut -d. -f1)"

# Remove distro default cluster so we avoid using the default PostgreSQL data directory.
if ${SUDO} pg_lsclusters 2>/dev/null | awk '{print $2}' | grep -qx 'main'; then
  echo "Dropping default cluster ${PG_VERSION}/main..."
  ${SUDO} pg_dropcluster --stop "${PG_VERSION}" main
fi

create_cluster() {
  local cluster_name="$1"
  local port="$2"
  local datadir="$3"

  if ${SUDO} pg_lsclusters 2>/dev/null | awk '{print $2}' | grep -qx "${cluster_name}"; then
    echo "Cluster ${cluster_name} already exists, skipping create"
  else
    echo "Creating cluster ${cluster_name} at ${datadir} on port ${port}"
    ${SUDO} pg_createcluster --datadir "${datadir}" --port "${port}" "${PG_VERSION}" "${cluster_name}"
  fi

  ${SUDO} pg_ctlcluster "${PG_VERSION}" "${cluster_name}" start
}

create_cluster "auth" 5433 "${DATA_ROOT}/auth"
create_cluster "user" 5434 "${DATA_ROOT}/user"
create_cluster "default" 5432 "${DATA_ROOT}/default"

if ! command -v migrate >/dev/null 2>&1; then
  echo "migrate CLI is required but not installed. Run tools/scripts/setup-linux-general.sh first."
  exit 1
fi

ensure_db_and_migrate() {
  local port="$1"
  local db_name="$2"
  local service="$3"

  echo "Ensuring database ${db_name} exists on port ${port}..."
  ${SUDO} -u postgres psql -p "${port}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${db_name}'" | grep -q 1 \
    || ${SUDO} -u postgres createdb -p "${port}" "${db_name}"

  local dsn="postgres://postgres@localhost:${port}/${db_name}?sslmode=disable"
  echo "Running migrations for ${service} on ${db_name}..."
  DB_URL="${dsn}" "${REPO_ROOT}/tools/scripts/migrate.sh" up "${service}"
}

ensure_db_and_migrate 5433 "auth_db" "auth"
ensure_db_and_migrate 5434 "users_db" "user"
ensure_db_and_migrate 5432 "messaging_db" "backend"

echo "Enabling and starting RabbitMQ and Memcached..."
${SUDO} systemctl enable rabbitmq-server memcached >/dev/null 2>&1 || true
for svc in rabbitmq-server memcached; do
  if ${SUDO} systemctl is-active --quiet "$svc"; then
    echo "$svc already running, skipping restart."
  else
    echo "Starting $svc..."
    ${SUDO} systemctl start "$svc"
  fi
done

echo ""
echo "Local Linux setup complete (non-containerized mode)."
echo "PostgreSQL data directories:"
echo " - ${DATA_ROOT}/auth"
echo " - ${DATA_ROOT}/user"
echo " - ${DATA_ROOT}/default"
echo ""
echo "Verify installation with:"
echo "  pg_lsclusters"
echo "  sudo systemctl status rabbitmq-server --no-pager"
echo "  sudo systemctl status memcached --no-pager"
echo "  pg_isready -h localhost -p 5433"
echo "  pg_isready -h localhost -p 5434"
echo "  pg_isready -h localhost -p 5432"
echo "  psql 'postgres://postgres@localhost:5433/auth_db?sslmode=disable' -c 'select 1;'"
echo "  psql 'postgres://postgres@localhost:5434/users_db?sslmode=disable' -c 'select 1;'"
echo "  psql 'postgres://postgres@localhost:5432/messaging_db?sslmode=disable' -c 'select 1;'"
