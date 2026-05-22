#!/bin/bash

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Generating Headlamp Authentication Token...${NC}"
echo -e "${BLUE}==================================================${NC}"

# Generate the service account token for headlamp
TOKEN=$(kubectl create token headlamp --namespace kube-system 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Failed to generate token. Make sure Kubernetes is running and Headlamp is installed.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Copy the following authentication token to login to Headlamp:${NC}\n"
echo -e "${GREEN}${TOKEN}${NC}\n"

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Starting Headlamp Port Forwarding...${NC}"
echo -e "${YELLOW}Access Headlamp UI at: http://localhost:8080${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Run port-forwarding
kubectl port-forward -n kube-system service/headlamp 8080:80
