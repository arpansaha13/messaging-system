#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load local environment configurations
if [[ -f "${REPO_ROOT}/.env.local" ]]; then
  set -a
  source "${REPO_ROOT}/.env.local"
  set +a
else
  echo "Error: .env.local not found."
  exit 1
fi

# Define colors
GREEN=$'\e[0;32m'
RED=$'\e[0;31m'
YELLOW=$'\e[0;33m'
NC=$'\e[0m' # No Color

# Helper to check if PID is running
is_running_pid() {
  local pid="$1"
  kill -0 "$pid" 2>/dev/null
}

# Helper to check if a TCP port is listening
check_tcp_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1 && ss -tln 2>/dev/null | grep -qE ":${port}(\s|$)"; then
    return 0
  elif command -v netstat >/dev/null 2>&1 && netstat -tln 2>/dev/null | grep -qE ":${port}(\s|$)"; then
    return 0
  elif (echo > "/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# Helper to check port listener PID (handles comma-separated list, falls back to ss)
get_port_pid() {
  local ports="$1"
  ports=$(echo "$ports" | tr ',' ' ')
  for p in $ports; do
    local pid=""
    if command -v lsof >/dev/null 2>&1; then
      pid=$(lsof -t -i :"$p" 2>/dev/null | head -n 1 || echo "")
    fi
    if [[ -z "$pid" ]] && command -v ss >/dev/null 2>&1; then
      pid=$(ss -tlnp 2>/dev/null | grep -E ":${p}(\s|$)" | grep -oE "pid=[0-9]+" | head -n 1 | cut -d= -f2 || echo "")
    fi
    if [[ -n "$pid" ]]; then
      echo "$pid"
      return 0
    fi
  done
  echo ""
}

print_service_status() {
  local name="$1"
  local expected_port="$2"
  local pid_file="$3"
  local log_file="$4"

  local status="Stopped"
  local pid=""
  local color="$RED"
  local actual_port="N/A"

  # Determine PID from PID file
  if [[ -f "$pid_file" ]]; then
    pid=$(cat "$pid_file")
    if is_running_pid "$pid"; then
      status="Running"
      color="$GREEN"
    else
      status="Zombie (dead)"
      color="$YELLOW"
    fi
  fi

  # Double-check port if expected
  if [[ -n "$expected_port" ]]; then
    local port_pid
    port_pid=$(get_port_pid "$expected_port")

    # Check if any expected port is actually listening
    local port_listening=1
    local ports
    ports=$(echo "$expected_port" | tr ',' ' ')
    for p in $ports; do
      if check_tcp_port "$p"; then
        port_listening=0
        break
      fi
    done

    if [[ -n "$port_pid" ]]; then
      status="Running"
      color="$GREEN"
      pid="$port_pid"
      actual_port="$expected_port"
    elif [[ "$port_listening" -eq 0 && "$status" == "Running" ]]; then
      status="Running"
      color="$GREEN"
      actual_port="$expected_port"
    elif [[ "$status" == "Running" ]]; then
      status="Starting"
      color="$YELLOW"
    fi
  else
    actual_port="None"
  fi

  # Format log file output to be relative path for readability
  local rel_log_file="None"
  if [[ -n "$log_file" ]]; then
    rel_log_file="${log_file#$REPO_ROOT/}"
  fi

  printf "%-15s | %-24s | %-6s | %-12s | %s\n" \
    "$name" \
    "${color}${status}${NC}" \
    "${pid:-N/A}" \
    "$actual_port" \
    "$rel_log_file"
}

echo "=========================================================================================="
echo "                       Messaging System Dev Service Status"
echo "=========================================================================================="
printf "%-15s | %-15s | %-6s | %-12s | %s\n" "Service" "Status" "PID" "Port(s)" "Log File"
echo "------------------------------------------------------------------------------------------"

# Nginx
print_service_status "nginx" "7000" "/tmp/nginx_dev.pid" "/tmp/nginx_dev_error.log"

# Frontend
print_service_status "frontend" "3000" "${REPO_ROOT}/.pids/frontend.pid" "${REPO_ROOT}/logs/frontend.log"

# Auth Service
print_service_status "auth-service" "4001,50051" "${REPO_ROOT}/.pids/auth.pid" "${REPO_ROOT}/logs/auth.log"

# Backend Service
print_service_status "backend" "4003" "${REPO_ROOT}/.pids/backend.pid" "${REPO_ROOT}/logs/backend.log"

# Socket Service
print_service_status "socket" "4004" "${REPO_ROOT}/.pids/socket.pid" "${REPO_ROOT}/logs/socket.log"

# Chat Worker
print_service_status "chat-worker" "" "${REPO_ROOT}/.pids/chat-worker.pid" "${REPO_ROOT}/logs/chat-worker.log"

echo "=========================================================================================="
echo "Infrastructure status checks:"

# Check PostgreSQL instances
pg_5432=$( (pg_isready -p 5432 -h localhost >/dev/null 2>&1 || check_tcp_port 5432) && echo "${GREEN}Active${NC}" || echo "${RED}Inactive${NC}" )
pg_5433=$( (pg_isready -p 5433 -h localhost >/dev/null 2>&1 || check_tcp_port 5433) && echo "${GREEN}Active${NC}" || echo "${RED}Inactive${NC}" )
rabbitmq=$(check_tcp_port 5672 && echo "${GREEN}Active${NC}" || echo "${RED}Inactive${NC}")
memcached=$(check_tcp_port 11211 && echo "${GREEN}Active${NC}" || echo "${RED}Inactive${NC}")

echo " - PostgreSQL (default, 5432): $pg_5432"
echo " - PostgreSQL (auth, 5433):    $pg_5433"
echo " - RabbitMQ (5672):            $rabbitmq"
echo " - Memcached (11211):          $memcached"
echo "=========================================================================================="
