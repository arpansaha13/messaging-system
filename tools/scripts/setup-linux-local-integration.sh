#!/usr/bin/env bash
set -euo pipefail

# Local PostgreSQL setup for external integration tests.
# Creates isolated auth/backend/user clusters on dedicated ports,
# then creates test databases and runs migrations.

if [[ "${EUID}" -ne 0 ]]; then
  echo "This script must be run as root."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This script currently supports Debian/Ubuntu Linux only (apt-get required)."
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_ROOT="${REPO_ROOT}/data/integration"

mkdir -p "${DATA_ROOT}/auth" "${DATA_ROOT}/user" "${DATA_ROOT}/default"

echo "Ensuring PostgreSQL is installed..."
apt-get update
apt-get install -y postgresql postgresql-contrib

PG_VERSION="$(psql -V | awk '{print $3}' | cut -d. -f1)"

create_cluster() {
  local cluster_name="$1"
  local port="$2"
  local datadir="$3"

  if pg_lsclusters 2>/dev/null | awk '{print $2}' | grep -qx "${cluster_name}"; then
    echo "Cluster ${cluster_name} already exists, skipping create"
  else
    echo "Creating integration cluster ${cluster_name} at ${datadir} on port ${port}"
    pg_createcluster --datadir "${datadir}" --port "${port}" "${PG_VERSION}" "${cluster_name}"
  fi

  pg_ctlcluster "${PG_VERSION}" "${cluster_name}" start
}

create_cluster "int-auth" 6433 "${DATA_ROOT}/auth"
create_cluster "int-user" 6434 "${DATA_ROOT}/user"
create_cluster "int-default" 6432 "${DATA_ROOT}/default"

if ! command -v migrate >/dev/null 2>&1; then
  echo "migrate CLI is required but not installed. Run tools/scripts/setup-linux-general.sh first."
  exit 1
fi

ensure_db_and_migrate() {
  local port="$1"
  local db_name="$2"
  local service="$3"

  echo "Ensuring database ${db_name} exists on port ${port}..."
  runuser -u postgres -- psql -p "${port}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${db_name}'" | grep -q 1 \
    || runuser -u postgres -- createdb -p "${port}" "${db_name}"

  local dsn="postgres://postgres@/${db_name}?host=/var/run/postgresql&port=${port}&sslmode=disable"
  echo "Running migrations for ${service} on ${db_name}..."
  runuser -u postgres -- env DB_URL="${dsn}" "${REPO_ROOT}/tools/scripts/migrate.sh" up "${service}"
}

ensure_db_and_migrate 6433 "auth_db" "auth"
ensure_db_and_migrate 6434 "users_db" "user"
ensure_db_and_migrate 6432 "messaging_db" "backend"

echo ""
echo "Local integration PostgreSQL setup complete."
echo "PostgreSQL data directories:"
echo " - ${DATA_ROOT}/auth"
echo " - ${DATA_ROOT}/user"
echo " - ${DATA_ROOT}/default"
