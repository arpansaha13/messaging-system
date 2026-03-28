#!/bin/bash

# Script to run database migrations for messaging-system backend
# Usage: ./tools/scripts/migrate.sh [up|down|status|create <name>]

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $0 [up|down|status|create <name>]"
  echo "  up            - Apply all pending migrations"
  echo "  down          - Rollback the last migration"
  echo "  status        - Show current migration version"
  echo "  create <name> - Create a new migration"
  exit 1
fi

if ! command -v migrate >/dev/null 2>&1; then
  echo "Error: golang-migrate CLI not found (migrate)."
  echo "Install it: https://github.com/golang-migrate/migrate"
  exit 1
fi

COMMAND=$1
MIGRATIONS_DIR="apps/backend/server/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Error: migrations directory not found at $MIGRATIONS_DIR"
  exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Use DATABASE_URL from environment or default
DB_URL="${DATABASE_URL:-postgres://user:password@localhost:7020/messaging}"

MIGRATE_BASE=(migrate -path "$MIGRATIONS_DIR" -database "$DB_URL")

case "$COMMAND" in
  up)
    echo "Applying migrations..."
    "${MIGRATE_BASE[@]}" up
    echo "Migrations applied successfully!"
    ;;
  down)
    echo "Rolling back last migration..."
    "${MIGRATE_BASE[@]}" down 1
    echo "Migration rolled back successfully!"
    ;;
  status)
    echo "Checking migration status..."
    "${MIGRATE_BASE[@]}" version
    ;;
  create)
    if [ $# -lt 2 ]; then
      echo "Error: migration name is required"
      echo "Usage: $0 create <name>"
      exit 1
    fi
    echo "Creating migration..."
    migrate create -ext sql -dir "$MIGRATIONS_DIR" -seq "$2"
    ;;
  *)
    echo "Error: Unknown command '$COMMAND'"
    echo "Use 'up', 'down', 'status', or 'create <name>'"
    exit 1
    ;;
esac
