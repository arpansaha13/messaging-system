#!/bin/bash
set -euo pipefail

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# General (non-container-specific) tools for messaging-system on macOS
TOOLS=(
  "protoc-gen-go:protoc-gen-go"
  "protoc-gen-go-grpc:protoc-gen-go-grpc"
  "protoc:protobuf"
  "task:go-task"
  "migrate:golang-migrate"
  "goimports:goimports"
  "gopls:gopls"
)

MISSING_TOOLS=()

echo -e "\nChecking availability of required general tools:\n"

for tool_entry in "${TOOLS[@]}"; do
  CMD="${tool_entry%%:*}"
  BREW_PKG="${tool_entry#*:}"

  if command -v "$CMD" >/dev/null 2>&1; then
    echo -e " - $CMD: ${GREEN}Installed${NC}"
  else
    echo -e " - $CMD: ${RED}Not Installed${NC}"
    MISSING_TOOLS+=("$BREW_PKG")
  fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo -e "${RED}Homebrew is not installed.${NC}"
    echo "Please install Homebrew first by running the following command:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo "Then re-run this script."
    exit 1
  fi

  echo -e "\nInstalling missing general tools via Homebrew...\n"
  for pkg in "${MISSING_TOOLS[@]}"; do
    echo "Installing $pkg..."
    brew install "$pkg"
  done
fi

if command -v node >/dev/null 2>&1; then
  echo -e " - node: ${GREEN}Installed${NC}"
else
  echo -e " - node: ${RED}Not Installed${NC}"
  echo "Node.js is required. Install Node.js first, then rerun this script."
  exit 1
fi

if command -v npm >/dev/null 2>&1; then
  if command -v pnpm >/dev/null 2>&1; then
    echo -e " - pnpm: ${GREEN}Installed${NC}"
  else
    echo -e " - pnpm: ${RED}Not Installed${NC}"
    echo "Installing pnpm globally via npm..."
    npm install -g pnpm
  fi
else
  echo -e " - npm: ${RED}Not Installed${NC}"
  echo "npm is required to install pnpm globally. Install npm first, then rerun this script."
  exit 1
fi

echo -e "\n${GREEN}General setup complete!${NC}"
