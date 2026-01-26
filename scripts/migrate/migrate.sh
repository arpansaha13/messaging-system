#!/bin/bash

# Script to run database migrations for messaging-system backend
# Usage: ./scripts/migrate.sh [up|down|status]

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 [up|down|status]"
    echo "  up     - Apply all pending migrations"
    echo "  down   - Rollback the last migration"
    echo "  status - Show migration status"
    exit 1
fi

COMMAND=$1
MIGRATIONS_DIR="apps/backend-go/migrations"

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
DB_URL="${DATABASE_URL:-postgres://user:password@localhost:5432/messaging}"

case "$COMMAND" in
    up)
        echo "Applying migrations..."
        for migration_file in "$MIGRATIONS_DIR"/*.up.sql; do
            if [ -f "$migration_file" ]; then
                echo "Running: $migration_file"
                psql "$DB_URL" -f "$migration_file"
            fi
        done
        echo "Migrations applied successfully!"
        ;;
    down)
        echo "Rolling back migrations..."
        # Apply down migrations in reverse order
        for migration_file in $(ls -r "$MIGRATIONS_DIR"/*.down.sql); do
            if [ -f "$migration_file" ]; then
                echo "Rolling back: $migration_file"
                psql "$DB_URL" -f "$migration_file"
            fi
        done
        echo "Migrations rolled back successfully!"
        ;;
    status)
        echo "Checking migration status..."
        psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'"
        echo "Use 'up', 'down', or 'status'"
        exit 1
        ;;
esac
