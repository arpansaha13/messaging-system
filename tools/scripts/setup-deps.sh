#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required but not installed."
  exit 1
fi

if ! command -v go >/dev/null 2>&1; then
  echo "Go is required but not installed."
  exit 1
fi

echo "Installing Node workspace dependencies with pnpm..."
(
  cd "$REPO_ROOT"
  pnpm install
)

echo "Discovering Go modules..."
GO_MODULE_DIRS=()
while IFS= read -r module_dir; do
  GO_MODULE_DIRS+=("$module_dir")
done < <(
  cd "$REPO_ROOT"
  rg --files -g 'go.mod' | xargs -I{} dirname {} | sort -u
)

if [[ ${#GO_MODULE_DIRS[@]} -eq 0 ]]; then
  echo "No Go modules found."
  exit 0
fi

echo "Downloading Go dependencies for all modules..."
for module_dir in "${GO_MODULE_DIRS[@]}"; do
  echo " - $module_dir"
  (
    cd "$REPO_ROOT/$module_dir"
    go mod download
  )
done

echo ""
echo "Dependency setup complete."
