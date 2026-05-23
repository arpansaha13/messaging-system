#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

MIGRATE_BIN="$(command -v migrate || true)"
if [[ -z "${MIGRATE_BIN}" ]]; then
  GOPATH_BIN="$(go env GOPATH 2>/dev/null)/bin/migrate"
  if [[ -x "${GOPATH_BIN}" ]]; then
    MIGRATE_BIN="${GOPATH_BIN}"
  fi
fi

if [[ -z "${MIGRATE_BIN}" || ! -x "${MIGRATE_BIN}" ]]; then
  echo "migrate CLI is required but not installed."
  exit 1
fi

usage() {
  cat <<USAGE
Usage:
  tools/scripts/migrate.sh <action> <service> [name]

Actions:
  up         Run pending migrations
  down       Roll back last migration
  status     Show migration version
  create     Create a new migration (requires [name])

Services:
  auth | backend | user

Environment (for up/down/status):
  DB_URL (required for up/down/status)
USAGE
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

action="$1"
service="$2"
name="${3:-}"

case "$service" in
  auth)
    mig_path="apps/auth/server/migrations"
    ;;
  backend)
    mig_path="apps/backend/server/migrations"
    ;;
  user)
    mig_path="apps/user/migrations"
    ;;
  *)
    echo "Unsupported service: $service"
    usage
    exit 1
    ;;
esac

full_mig_path="${REPO_ROOT}/${mig_path}"

# Caution for future changes:
# This script is intentionally single-service-per-invocation. If you add a
# "run all services" mode later, do not reuse one DB_URL across services.
# Resolve a distinct DB URL per service to avoid running migrations on
# the wrong database.

case "$action" in
  up)
    if [[ -z "${DB_URL:-}" ]]; then
      echo "DB_URL is required for action: up"
      usage
      exit 1
    fi
    echo ">>> Running migrations UP for [$service]"
    "${MIGRATE_BIN}" -path "$full_mig_path" -database "$DB_URL" up
    ;;
  down)
    if [[ -z "${DB_URL:-}" ]]; then
      echo "DB_URL is required for action: down"
      usage
      exit 1
    fi
    echo ">>> Rolling back last migration for [$service]"
    "${MIGRATE_BIN}" -path "$full_mig_path" -database "$DB_URL" down 1
    ;;
  status)
    if [[ -z "${DB_URL:-}" ]]; then
      echo "DB_URL is required for action: status"
      usage
      exit 1
    fi
    echo ">>> Status for [$service]"
    "${MIGRATE_BIN}" -path "$full_mig_path" -database "$DB_URL" version
    ;;
  create)
    if [[ -z "$name" ]]; then
      echo "Migration name is required for create action."
      usage
      exit 1
    fi
    echo ">>> Creating migration '$name' for [$service]"
    "${MIGRATE_BIN}" create -ext sql -dir "$full_mig_path" -seq "$name"
    ;;
  *)
    echo "Unsupported action: $action"
    usage
    exit 1
    ;;
esac
