#!/usr/bin/env bash
set -euo pipefail

# Reusable script to start/stop the local messaging-system dev server on Linux.
# Resolves ports, clears existing processes, compiles Go services, and launches them.

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

# Helper to stop a service by its PID file
stop_service() {
  local name="$1"
  local pid_file="${REPO_ROOT}/.pids/${name}.pid"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid=$(cat "${pid_file}")
    if kill -0 "${pid}" 2>/dev/null; then
      echo "Stopping ${name} (PID ${pid})..."
      kill -15 "${pid}" 2>/dev/null || kill -9 "${pid}" 2>/dev/null
    fi
    rm -f "${pid_file}"
  fi
}

# Helper to kill any process listening on a specific port
kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -t -i :"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "Port $port is in use by PID(s): $pids. Cleaning up..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
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

# Verify local infra status (Postgres, RabbitMQ, Memcached) and start if needed
start_infra() {
  echo "Verifying local infrastructure services..."

  local pg_ver
  pg_ver=$(psql -V | awk '{print $3}' | cut -d. -f1 || echo "16")

  # Check default Postgres (port 5432)
  if ! pg_isready -p 5432 -h localhost >/dev/null 2>&1 && ! check_tcp_port 5432; then
    echo "PostgreSQL (default, port 5432) is not running. Attempting to start..."
    pg_ctlcluster "${pg_ver}" default start || echo "Warning: Could not start default PostgreSQL. Please start it manually."
  fi

  # Check auth Postgres (port 5433)
  if ! pg_isready -p 5433 -h localhost >/dev/null 2>&1 && ! check_tcp_port 5433; then
    echo "PostgreSQL (auth cluster, port 5433) is not running. Attempting to start..."
    pg_ctlcluster "${pg_ver}" auth start || echo "Warning: Could not start auth PostgreSQL cluster. Please start it manually."
  fi

  # Check RabbitMQ (port 5672)
  if ! check_tcp_port 5672; then
    echo "RabbitMQ is not running. Attempting to start..."
    rabbitmq-server -detached || echo "Warning: Could not start RabbitMQ. Please start it manually."
  fi

  # Check Memcached (port 11211)
  if ! check_tcp_port 11211; then
    echo "Memcached is not running. Attempting to start..."
    if [[ "${EUID}" -eq 0 ]]; then
      memcached -d -u nobody || echo "Warning: Could not start Memcached. Please start it manually."
    else
      memcached -d || echo "Warning: Could not start Memcached. Please start it manually."
    fi
  fi
}

stop_all() {
  echo "Stopping all local dev services..."

  # Stop Nginx
  if [[ -f "/tmp/nginx_dev.pid" ]]; then
    local nginx_pid
    nginx_pid=$(cat "/tmp/nginx_dev.pid")
    echo "Stopping Nginx (PID ${nginx_pid})..."
    nginx -c "${REPO_ROOT}/apps/nginx/nginx.local.conf" -s stop 2>/dev/null || kill -9 "${nginx_pid}" 2>/dev/null || true
    rm -f "/tmp/nginx_dev.pid"
  fi

  # Stop Go services and frontend
  for svc in auth backend socket chat-worker frontend; do
    stop_service "$svc"
  done

  # Force clear ports to ensure no ghost processes remain
  for port in 7000 3000 4001 4003 4004 50051; do
    kill_port "$port"
  done

  echo "All services stopped successfully."
}

start_all() {
  # Stop anything running first to prevent port conflicts
  stop_all

  # Ensure Postgres/RabbitMQ/Memcached are up
  start_infra

  # Create directories for logs and pids
  mkdir -p "${REPO_ROOT}/.pids"
  mkdir -p "${REPO_ROOT}/logs"

  # Create Nginx temp directories
  mkdir -p /tmp/nginx_dev_client_body /tmp/nginx_dev_proxy /tmp/nginx_dev_fastcgi /tmp/nginx_dev_uwsgi /tmp/nginx_dev_scgi

  echo "Compiling Go services..."
  
  # Build auth
  (cd "${REPO_ROOT}/apps/auth/server" && go build -o bin/auth ./cmd/server)
  # Build backend
  (cd "${REPO_ROOT}/apps/backend/server" && go build -o bin/backend ./cmd/server)
  # Build socket
  (cd "${REPO_ROOT}/apps/socket" && go build -o bin/socket ./cmd/server)
  # Build chat-worker
  (cd "${REPO_ROOT}/apps/chat-worker" && go build -o bin/chat-worker ./cmd/chat-worker)

  echo "Starting services..."

  # 1. Start Auth Service
  echo " - Starting Auth Service..."
  DATABASE_URL="$AUTH_DATABASE_URL" \
  HTTP_PORT="$AUTH_HTTP_PORT" \
  GRPC_PORT="50051" \
  METRICS_PORT="$AUTH_METRICS_PORT" \
  "${REPO_ROOT}/apps/auth/server/bin/auth" > "${REPO_ROOT}/logs/auth.log" 2>&1 &
  echo $! > "${REPO_ROOT}/.pids/auth.pid"

  # 2. Start Backend Service
  echo " - Starting Backend Service..."
  DATABASE_URL="$BACKEND_DATABASE_URL" \
  API_PORT="$BACKEND_HTTP_PORT" \
  METRICS_PORT="$BACKEND_METRICS_PORT" \
  "${REPO_ROOT}/apps/backend/server/bin/backend" > "${REPO_ROOT}/logs/backend.log" 2>&1 &
  echo $! > "${REPO_ROOT}/.pids/backend.pid"

  # 3. Start Socket Service
  echo " - Starting Socket Service..."
  PORT="$SOCKET_HTTP_PORT" \
  METRICS_PORT="$SOCKET_METRICS_PORT" \
  "${REPO_ROOT}/apps/socket/bin/socket" > "${REPO_ROOT}/logs/socket.log" 2>&1 &
  echo $! > "${REPO_ROOT}/.pids/socket.pid"

  # 4. Start Chat Worker
  echo " - Starting Chat Worker..."
  DATABASE_URL="$BACKEND_DATABASE_URL" \
  "${REPO_ROOT}/apps/chat-worker/bin/chat-worker" > "${REPO_ROOT}/logs/chat-worker.log" 2>&1 &
  echo $! > "${REPO_ROOT}/.pids/chat-worker.pid"

  # 5. Start Frontend (Nuxt)
  echo " - Starting Frontend (Nuxt)..."
  pnpm --dir "${REPO_ROOT}/apps/frontend" run dev > "${REPO_ROOT}/logs/frontend.log" 2>&1 &
  echo $! > "${REPO_ROOT}/.pids/frontend.pid"

  # 6. Start Nginx
  echo " - Starting Nginx Reverse Proxy..."
  if ! command -v nginx >/dev/null 2>&1; then
    echo "Error: Nginx not installed. Cannot start reverse proxy on port 7000."
    exit 1
  fi
  nginx -c "${REPO_ROOT}/apps/nginx/nginx.local.conf"

  echo "=========================================================="
  echo "Local Dev Environment started successfully!"
  echo "Access the app via Nginx at: http://localhost:7000"
  echo "Logs are available at: ${REPO_ROOT}/logs/"
  echo "PIDs are stored in: ${REPO_ROOT}/.pids/"
  echo "=========================================================="
}

# Handle options
ACTION="start"
if [[ $# -gt 0 ]]; then
  case "$1" in
    --stop|-s|stop)
      ACTION="stop"
      ;;
    *)
      echo "Usage: $0 [start|stop|--stop]"
      exit 1
      ;;
  esac
fi

if [[ "$ACTION" == "stop" ]]; then
  stop_all
else
  start_all
fi
