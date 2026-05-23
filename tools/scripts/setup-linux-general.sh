#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "This script must be run as root."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This script currently supports Debian/Ubuntu Linux only (apt-get required)."
  exit 1
fi

echo "Installing base development dependencies..."
apt-get update
apt-get install -y protobuf-compiler curl git build-essential locales

echo "Ensuring UTF-8 locale is configured (en_US.UTF-8)..."
locale-gen en_US.UTF-8
update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but not installed. Install Node.js first, then rerun this script."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not installed. Install npm first, then rerun this script."
  exit 1
fi

if ! command -v go >/dev/null 2>&1; then
  echo "Go is required but not installed. Install Go first, then rerun this script."
  exit 1
fi

GOBIN_DIR="$(go env GOPATH)/bin"
mkdir -p "$GOBIN_DIR"

install_go_tool() {
  local cmd="$1"
  local module="$2"

  if command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd already installed"
  else
    echo "Installing $cmd..."
    GO111MODULE=on go install "$module"
  fi
}

install_go_tool "protoc-gen-go" "google.golang.org/protobuf/cmd/protoc-gen-go@latest"
install_go_tool "protoc-gen-go-grpc" "google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"
install_go_tool "task" "github.com/go-task/task/v3/cmd/task@latest"
install_go_tool "goimports" "golang.org/x/tools/cmd/goimports@latest"
install_go_tool "gopls" "golang.org/x/tools/gopls@latest"

# Install migrate with postgres build tag so DB migrations work for postgres URLs.
if command -v migrate >/dev/null 2>&1; then
  echo "migrate already installed"
else
  echo "Installing migrate with postgres driver support..."
  GOBIN="$(go env GOPATH)/bin" go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm already installed"
else
  echo "Installing pnpm globally via npm..."
  npm install -g pnpm
fi

echo ""
echo "General Linux setup complete."
echo "If needed, add this to your shell config:"
echo "  export PATH=\"$GOBIN_DIR:\$PATH\""
