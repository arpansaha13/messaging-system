#!/usr/bin/env bash
# run-resilience.sh — Run DB migrations, resilience tests, and teardown.
# Must be executed from tests/resilience/ (the resilience package root).

set -euo pipefail

COMPOSE_FILE="../../compose.test.yaml"
COMPOSE_ENV_FILE=".env.test"
CONFIG="vitest.config.ts"
SKIP_MIGRATIONS=false
NO_TEARDOWN=false
SPEC_FILE=""

# Path to goauthkit migrations — edit if goauthkit lives elsewhere
GOAUTHKIT_MIGRATIONS_DIR="../../../goauthkit/migrations"

AUTH_DB_URL="postgres://testuser:testpass@localhost:7511/auth_resilience_db?sslmode=disable"
MESSAGING_DB_URL="postgres://testuser:testpass@localhost:7521/messaging_resilience_db?sslmode=disable"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-migrations)  SKIP_MIGRATIONS=true;  shift ;;
    --no-teardown)      NO_TEARDOWN=true;      shift ;;
    --spec)
      SPEC_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-migrations] [--no-teardown] [--spec <path>]"
      exit 1
      ;;
  esac
done

log() { echo "[run-resilience] $*"; }

teardown() {
  if [[ "$NO_TEARDOWN" == false ]]; then
    log "Tearing down resilience stack..."
    docker compose --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE" --profile resilience down -v --remove-orphans
  else
    log "Skipping teardown (--no-teardown). Run manually:"
    echo "  docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE --profile resilience down -v"
  fi
}

# ---------------------------------------------------------------------------
# 1. Run database migrations
# ---------------------------------------------------------------------------
if [[ "$SKIP_MIGRATIONS" == false ]]; then
  if ! command -v migrate &>/dev/null; then
    log "Error: 'migrate' CLI not found."
    log "Install from: https://github.com/golang-migrate/migrate/tree/master/cmd/migrate"
    exit 1
  fi
  log "Running auth DB migrations..."
  migrate -path "${GOAUTHKIT_MIGRATIONS_DIR}" -database "${AUTH_DB_URL}" up
  log "Running messaging DB migrations..."
  migrate -path "../../apps/backend/migrations" -database "${MESSAGING_DB_URL}" up
  log "Migrations complete."
else
  log "Skipping migrations (--skip-migrations)."
fi

# ---------------------------------------------------------------------------
# 2. Run tests — capture exit code so teardown always runs
# ---------------------------------------------------------------------------
EXIT_CODE=0

if [[ -n "$SPEC_FILE" ]]; then
  log "Running spec: $SPEC_FILE"
  pnpm exec vitest run "$SPEC_FILE" --config="$CONFIG" || EXIT_CODE=$?
else
  log "Running all resilience tests..."
  pnpm exec vitest run --config="$CONFIG" || EXIT_CODE=$?
fi

# ---------------------------------------------------------------------------
# 3. Tear down
# ---------------------------------------------------------------------------
teardown

exit "$EXIT_CODE"
