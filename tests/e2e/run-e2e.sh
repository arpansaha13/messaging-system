#!/usr/bin/env bash
# run-e2e.sh — Run DB migrations, E2E tests, and teardown.
# Building images and starting the stack are handled by npm scripts in package.json.
# Must be executed from tests/e2e/ (the e2e package root).
#
# Usage:
#   ./run-e2e.sh                        # run all specs
#   ./run-e2e.sh --spec auth/login      # run a specific spec file
#   ./run-e2e.sh --ui                   # interactive Playwright UI mode
#   ./run-e2e.sh --skip-migrations      # skip DB migrations (already applied)
#   ./run-e2e.sh --no-teardown          # keep stack running after tests
#
# Environment variables:
#   GOAUTHKIT_MIGRATIONS_DIR  Path to goauthkit migrations dir (default: relative to tests/e2e/)

set -euo pipefail

COMPOSE_FILE="../../compose.test.yaml"
COMPOSE_ENV_FILE=".env.test"
CONFIG="playwright.config.ts"
SKIP_MIGRATIONS=false
NO_TEARDOWN=false
UI_MODE=false
SPEC_FILE=""

# Path to goauthkit migrations — edit if goauthkit lives elsewhere
GOAUTHKIT_MIGRATIONS_DIR="../../../../7. Libraries/goauthkit/migrations"

AUTH_DB_URL="postgres://testuser:testpass@localhost:7511/auth_e2e_db?sslmode=disable"
MESSAGING_DB_URL="postgres://testuser:testpass@localhost:7521/messaging_e2e_db?sslmode=disable"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-migrations)  SKIP_MIGRATIONS=true;  shift ;;
    --no-teardown)      NO_TEARDOWN=true;      shift ;;
    --ui)               UI_MODE=true;          shift ;;
    --spec)
      SPEC_FILE="specs/$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-migrations] [--no-teardown] [--ui] [--spec <relative-path>]"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log() { echo "[run-e2e] $*"; }

teardown() {
  if [[ "$NO_TEARDOWN" == false ]]; then
    log "Tearing down test stack..."
    docker compose --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE" down -v --remove-orphans
  else
    log "Skipping teardown (--no-teardown). Run manually:"
    echo "  docker compose --env-file $COMPOSE_ENV_FILE -f $COMPOSE_FILE down -v"
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
# 2. Install dependencies (if node_modules missing)
# ---------------------------------------------------------------------------
if [[ ! -d "../../node_modules/@playwright" ]]; then
  log "Installing root dependencies..."
  pnpm install --frozen-lockfile
  pnpm exec playwright install chromium
fi

# ---------------------------------------------------------------------------
# 3. Run tests — capture exit code so teardown always runs
# ---------------------------------------------------------------------------
EXIT_CODE=0

if [[ "$UI_MODE" == true ]]; then
  log "Launching Playwright UI mode..."
  pnpm exec playwright test --ui --config="$CONFIG" || EXIT_CODE=$?
elif [[ -n "$SPEC_FILE" ]]; then
  log "Running spec: $SPEC_FILE"
  pnpm exec playwright test "$SPEC_FILE" --config="$CONFIG" || EXIT_CODE=$?
else
  log "Running all E2E tests..."
  pnpm exec playwright test --config="$CONFIG" || EXIT_CODE=$?
fi

# ---------------------------------------------------------------------------
# 4. Show trace hint on failure
# ---------------------------------------------------------------------------
if [[ "$EXIT_CODE" -ne 0 ]]; then
  log "Tests failed. View traces with:"
  echo "  pnpm exec playwright show-trace test-results/**/*.zip"
fi

# ---------------------------------------------------------------------------
# 5. Tear down
# ---------------------------------------------------------------------------
teardown

exit "$EXIT_CODE"
