#!/bin/bash

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Tools required for messaging-system
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

echo -e "\nChecking availability of required tools:\n"

for tool_entry in "${TOOLS[@]}"; do
    CMD="${tool_entry%%:*}"
    BREW_PKG="${tool_entry#*:}"

    if command -v "$CMD" &> /dev/null; then
        echo -e " - $CMD: ${GREEN}Installed${NC}"
    else
        echo -e " - $CMD: ${RED}Not Installed${NC}"
        MISSING_TOOLS+=("$BREW_PKG")
    fi
done

if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
    echo -e "\n${GREEN}All tools are installed and available!${NC}"
    exit 0
fi

echo -e "\nSome tools are missing. Attempting to install them..."

# Check if homebrew is available
if ! command -v brew &> /dev/null; then
    echo -e "${RED}Homebrew is not installed.${NC}"
    echo "Please install Homebrew first by running the following command:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo "Then re-run this script."
    exit 1
fi

echo -e "${GREEN}Homebrew is available. Installing missing tools...${NC}\n"

for pkg in "${MISSING_TOOLS[@]}"; do
    echo "Installing $pkg..."
    brew install "$pkg"
done

echo -e "\n${GREEN}Setup complete!${NC}"
