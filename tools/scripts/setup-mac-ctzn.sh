#!/bin/bash
set -euo pipefail

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Container/Kubernetes tooling for macOS
TOOLS=(
  "helm:helm"
  "skaffold:skaffold"
)

MISSING_TOOLS=()

echo -e "\nChecking container tooling availability:\n"
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

if command -v kubectl >/dev/null 2>&1; then
  echo -e " - kubectl: ${GREEN}Installed${NC}"
else
  echo -e " - kubectl: ${RED}Not Installed${NC}"
fi

INSTALL_HEADLAMP=false
if helm status headlamp -n kube-system >/dev/null 2>&1; then
  echo -e " - headlamp: ${GREEN}Installed${NC}"
else
  echo -e " - headlamp: ${RED}Not Installed${NC}"
  INSTALL_HEADLAMP=true
fi

if [ ${#MISSING_TOOLS[@]} -eq 0 ] && [ "$INSTALL_HEADLAMP" = false ]; then
  echo -e "\n${GREEN}Container tooling is fully installed.${NC}"
  exit 0
fi

if ! command -v brew >/dev/null 2>&1; then
  echo -e "${RED}Homebrew is not installed.${NC}"
  echo 'Install Homebrew first: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo -e "\nInstalling missing tooling via Homebrew..."
  for pkg in "${MISSING_TOOLS[@]}"; do
    echo "Installing $pkg..."
    brew install "$pkg"
  done
fi

if [ "$INSTALL_HEADLAMP" = true ]; then
  echo -e "\nInstalling headlamp via helm..."
  helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/
  helm upgrade --install headlamp headlamp/headlamp --create-namespace --namespace kube-system
fi

echo -e "\n${GREEN}Container setup complete!${NC}"
