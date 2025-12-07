#!/bin/bash
# Migration helper script for Windows and Unix
# Usage: ./scripts/migrate.sh [command]
# Commands:
#   run     - Run pending migrations
#   revert  - Revert last migration
#   show    - Show migration status
#   create  - Create a new migration file [name]
#   generate - Auto-generate migration from entities [name]

COMMAND=${1:-run}
MIGRATION_NAME=$2

case $COMMAND in
  run)
    echo "Running pending migrations..."
    cd apps/backend && pnpm run build && pnpx typeorm migration:run -d dist/data-source.js
    ;;
  revert)
    echo "Reverting last migration..."
    cd apps/backend && pnpx typeorm migration:revert -d dist/data-source.js
    ;;
  show)
    echo "Showing migration status..."
    cd apps/backend && pnpx typeorm migration:show -d dist/data-source.js
    ;;
  create)
    if [ -z "$MIGRATION_NAME" ]; then
      echo "Error: Migration name required"
      echo "Usage: ./scripts/migrate.sh create <name>"
      exit 1
    fi
    echo "Creating migration: $MIGRATION_NAME"
    cd apps/backend && pnpx typeorm migration:create src/migrations/$MIGRATION_NAME
    ;;
  generate)
    if [ -z "$MIGRATION_NAME" ]; then
      echo "Error: Migration name required"
      echo "Usage: ./scripts/migrate.sh generate <name>"
      exit 1
    fi
    echo "Generating migration: $MIGRATION_NAME"
    cd apps/backend && pnpm run build && pnpx typeorm migration:generate -d dist/data-source.js src/migrations/$MIGRATION_NAME
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Available commands: run, revert, show, create, generate"
    exit 1
    ;;
esac
