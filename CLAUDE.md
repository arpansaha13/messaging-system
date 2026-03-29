# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Full-stack real-time messaging app. Monorepo with a **Go workspace** (backend services) and a **pnpm workspace** (frontend). All services are orchestrated via Docker Compose.

## Commands

### Full-stack development (recommended)

```bash
# Start all app services with hot-reload (Docker Compose watch mode, excludes logging stack)
pnpm dev
# Or equivalently:
docker compose --profile app watch --prune --prune

# To also start the logging stack (Kafka, Loki, Alloy, Grafana, Fluent-bit):
docker compose --profile app --profile logging watch

# To also start the metrics stack (Prometheus, Grafana, exporters, Tempo):
docker compose --profile app --profile metrics watch
```

### Per-service development

**Backend (Go — from `apps/backend/server/`)**

```bash
go run ./cmd/server          # run directly
go build -o bin/server ./cmd/server  # compile binary
go test ./tests/... -timeout 300s    # run integration tests (requires Docker for Testcontainers)
go test ./tests/... -coverprofile=coverage.out -timeout 300s  # with coverage
golangci-lint run            # lint
go fmt ./...                 # format
go vet ./...                 # vet
```

Migrations (requires `migrate` CLI and `DATABASE_URL` env):
```bash
migrate -path ./migrations -database "$DATABASE_URL" up
migrate -path ./migrations -database "$DATABASE_URL" down
```

**Frontend (Nuxt 4 — from `apps/frontend/`)**

```bash
pnpm dev          # dev server on :3000
pnpm build
pnpm lint
pnpm lint:fix
pnpm pretty       # prettier
pnpm test         # vitest (unit, happy-dom)
```

**Socket server (Go — from `apps/socket/`)**

```bash
go run ./cmd/server          # run directly
go build -o bin/server ./cmd/server  # compile binary
```

### E2E tests (Playwright — from `tests/e2e/`)

```bash
pnpm test              # build images, start stack, run all specs, teardown
pnpm test:ui           # same but Playwright UI mode
pnpm setup             # build images and start stack only
pnpm report            # open last HTML report
pnpm trace             # inspect traces from last run
# Direct runner (after setup):
./run-e2e.sh [--spec auth/login] [--skip-migrations] [--no-teardown] [--ui]
```

> Requires `migrate` CLI. Auth-DB migrations from `goauthkit`, messaging-DB from `apps/backend/server/migrations`.

### Load tests (k6 — from `tests/load/`)

```bash
pnpm test              # build images, start load stack, run personal + group specs
pnpm setup             # build images and start load stack only
pnpm spec:personal     # run personal message load spec
pnpm spec:group        # run group message load spec
```

> Uses `compose.test.yaml --profile load`. Auth-DB at `:7511`, messaging-DB at `:7521`. Requires `migrate` CLI and `k6`.

### Environment

Copy `.env.example` to `.env` before starting. All secrets and connection strings are env-only. The file documents every variable per service.

---

## Architecture

### Services

| Service                              | Language            | Purpose                                | Protocol          |
| ------------------------------------ | ------------------- | -------------------------------------- | ----------------- |
| `apps/auth/server`                   | Go                  | Auth microservice (sessions, OTP, JWT) | gRPC :50051       |
| `apps/backend/server`                | Go                  | REST API server                        | HTTP :4000        |
| `apps/chat-worker`                   | Go                  | Status updates + presence worker       | RabbitMQ consumer |
| `apps/socket`                        | Go                  | Real-time WebSocket server             | WebSocket :4000   |
| `apps/frontend`                      | TypeScript (Nuxt 4) | SSR web client                         | HTTP :3000        |
| `apps/nginx`                         | —                   | Reverse proxy + TLS                    | HTTPS :7000       |
| `apps/observability/loki/alloy/grafana/fluent-bit` | —       | Centralized logging stack              | —                 |
| `apps/observability/prometheus`                     | —       | Metrics scraping (metrics profile)     | HTTP :9090        |
| `apps/observability/tempo`                          | —       | Distributed trace backend              | gRPC :4317        |

### Go workspace

`go.work` links: `apps/common`, `apps/auth/server`, `apps/backend/server`, `apps/chat-worker`, `apps/socket`.

- `apps/common` — shared domain models (`domain.go`), broker interfaces, constants. Import it as `github.com/arpansaha13/messaging-system/apps/common/...`.
- All Go services depend on the external library `github.com/arpansaha13/gotoolkit` (DB connection with backoff, HTTP/gRPC middleware, GORM logger). During local development the workspace resolves the `gotoolkit` module if its path is listed in `go.work`.

### pnpm workspace

Workspace packages: `apps/frontend`, `tests/e2e`, `tests/load`. Enforce pnpm via `preinstall` hook — don't use npm/yarn. Constants and types that were previously in `packages/constants` and `packages/types` are now co-located in `apps/frontend/src/constants/` and `apps/frontend/src/types/`.

### Backend internal layout (`apps/backend/server/internal/`)

Strict layered architecture — each layer only depends on the one below it:

```
handler → service → repository → database (GORM)
```

- **`handler/`** — HTTP handlers; call service interfaces, never repositories directly.
- **`service/interfaces.go`** — all service interfaces defined here; handlers depend on interfaces, not concrete types (enables mocking in tests).
- **`repository/`** — all GORM queries; wrapped in circuit breakers (`internal/circuits`).
- **`app/setup_router.go`** — `SetupRouter(deps Deps) *mux.Router`: wires repos → services → handlers → router. Pass all deps through `app.Deps{}`. Creates an `apiRouter` subrouter via `router.PathPrefix("/api")` — handlers register paths **without** the `/api` prefix; health check is at `/api/livez`. **Route registration order matters**: user-group routes must be registered before user routes.
- **`app/setup_postgres.go`**, **`app/setup_rabbitmq.go`**, **`app/setup_auth.go`** — `Setup*` functions called from `main.go`; return only what `main` needs for injection or graceful shutdown.
- **`circuits/`** — circuit breakers for Postgres, RabbitMQ, and Auth gRPC using `gobreaker`. `gorm.ErrRecordNotFound` is treated as success (not an infra failure).

### Socket internal layout (`apps/socket/internal/`)

- **`app/setup_router.go`** — `SetupRouter(deps Deps) *mux.Router`: all socket routes under `router.PathPrefix("/ws")` subrouter; auth middleware applied to the protected sub-router.
- **`app/setup_auth.go`**, **`app/setup_memcached.go`**, **`app/setup_rabbitmq.go`** — `Setup*` functions called from `main.go`; same pattern as backend.
- **`middleware/auth.go`** — validates session token via gRPC auth service; populates request context with `userID` and `authUser`.
- **`service/interfaces.go`** — `IAuthServiceClient` interface; mirrors backend gRPC client pattern.
- **`ws/hub.go`** — Hub: RWMutex-protected registry of clients (socketId→Client) and rooms (roomId→set of socketIds).
- **`ws/client.go`** — Client: owns a buffered send channel; write pump with heartbeat (ping/pong, 60 s pongWait).
- **`ws/handler.go`** — WebSocket upgrader (gorilla/websocket); validates Origin against `CLIENT_DOMAIN`.
- **`ws/personal.go`**, **`ws/group.go`** — personal and group/channel event handling.
- **`broker/`** — RabbitMQ consumer/publisher (interface + impl). Three exchanges: `incoming_messages`, `outgoing_messages`, `subscription_data`.
- **`cache/memcached.go`** — online presence read/write.
- **`store/chats_store.go`** — in-memory ping tracking flushed to Memcached every 5 s.
- **`constants/events.go`** — all WS event name constants.
- Wire protocol: `{"event": "<name>", "data": <json>}` (both directions).

### Auth flow

`apps/auth/server` is a standalone gRPC service backed by its own PostgreSQL instance. `apps/backend/server` connects to it via gRPC and uses it through the `IAuthServiceClient` interface. The backend validates sessions on every protected request via `middleware.AuthMiddleware`.

### RabbitMQ event flow

Three exchanges, all `direct`:

```
incoming_messages  exchange:
  backend  → [personal.delivered / personal.read]  → chat-worker  (status updates)
  socket   → [connection.user]                      → chat-worker  (presence + subscription)

outgoing_messages  exchange:
  backend  → [receiverId]                           → socket server  (personal message delivery)
  backend  → [channel:channelId]                    → socket server  (group message delivery)
  socket   → [receiverId]                           → socket server  (typing indicators)

subscription_data  exchange:
  chat-worker → [serverId]                          → socket server  (channel/group bindings on connect)
```

The socket server declares two exclusive per-instance queues on startup: a **server queue** (bound to `outgoing_messages`) and a **subscription queue** (bound to `subscription_data`). Dynamic bindings for user IDs, channel IDs, and group IDs are added/removed on client connect/disconnect.

### Online status

Socket server tracks pings in-memory (`chats_store.go`) and flushes them to Memcached every 5 seconds. Presence TTL in Memcached is 60 seconds.

### Message lifecycle

1. Client shows a temp message immediately (optimistic UI, status: SENDING).
2. Client HTTP POSTs to the Backend API with the temp hash included.
3. API persists the message in a transaction, then publishes directly to `outgoing_messages` exchange (routing key = receiverId for personal, `channel:channelId` for group).
4. API returns 201 with real `{id, hash, createdAt, status}` — client swaps the temp for the real message (status: SENT).
5. Socket server receives the delivery event from `outgoing_messages` and emits it to the recipient's WebSocket connection.

### Metrics and tracing (metrics profile)

- `SetupTelemetry` in `internal/app/setup_telemetry.go` (both backend and auth) initialises OTel MeterProvider (Prometheus bridge) and TracerProvider (OTLP gRPC to Tempo). Call it once in `main.go` after logger init, before any other setup.
- `SetupMetrics` in `internal/app/setup_metrics.go` starts a `promhttp.Handler()` server on `METRICS_PORT` (default 9090) — Prometheus scrapes this endpoint.
- Metrics are bridged into the default Prometheus registry via `exporters/prometheus`. `otelhttp` (backend HTTP handler) and `otelgrpc` (auth gRPC server handler) emit OTel-native metrics automatically once MeterProvider is set.
- Auth gRPC uses `otelgrpc.NewServerHandler()` (stats handler, not interceptor). Metric names follow semconv v1.39.0: `rpc_server_call_duration_seconds`, labels `rpc_system_name`, `rpc_method`, `rpc_response_status_code`.
- Tracing is off when `OTLP_ENDPOINT` is unset (no-op TracerProvider). Set to `tempo:4317` in compose.yaml under the metrics profile.
- Grafana dashboards are provisioned from `apps/observability/grafana/provisioning/dashboards/`. Dashboard variables use `job` label to identify targets; DB dashboards hardcode `job` as a hidden constant (`postgres-auth-db` / `postgres-backend-db`).

### Logging pipeline

Go services → structured JSON (zap + OTel) → stdout → Fluent-bit → Kafka topic `application-logs` → Grafana Alloy → Loki → Grafana dashboards.

---

## Testing

**Backend integration tests** (`apps/backend/server/tests/`) use testify suite + Testcontainers (spins up a real Postgres container). Tests are isolated via table truncation in `SetupTest`. The mock auth service is in `tests/mocks/`. Run with `make test` from `apps/backend/server/`.

**Frontend unit tests** use Vitest with `@nuxt/test-utils` and `happy-dom`. Run with `pnpm test` from `apps/frontend/`.

**GORM logger** in tests is set to `Silent` mode to suppress query noise.

**E2E tests** (`tests/e2e/`) use Playwright against a full Docker Compose stack (`compose.test.yaml`).

- Stack: nginx (:7500 HTTP-only), auth, backend, socket, frontend, chat-worker, RabbitMQ, Postgres, Memcached.
- `global-setup.ts` seeds test users; `global-teardown.ts` cleans up.
- State isolation: each spec resets via DB helpers (`tests/e2e/helpers/db.ts`) and fresh Playwright browser contexts.
- Fixtures: `auth.fixture.ts` provides pre-logged-in pages for two users (Alice/Bob pattern).
- Auth-DB (:7511) is accessible from the host for OTP retrieval in login flows.

---

## Key conventions

- All Go services initialize GORM with `gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn)` — log at `Warn` level in production to surface slow queries/errors only.
- DB connections use `gotoolkit.ConnectPostgresWithBackoff` — exponential backoff on startup.
- RabbitMQ in backend auto-reconnects via `gotoolkit.ConnectionManager`; a goroutine monitors `conn.NotifyClose` and calls `connMgr.Signal()` to trigger reconnect.
- All Go services follow the `internal/app/Setup*` pattern: each external dependency has its own `Setup*` function in `internal/app/`; `main.go` calls them and constructs the HTTP/gRPC server itself. `Setup*` functions return only what `main` needs for injection or graceful shutdown.
- Graceful shutdown order in all services: HTTP/gRPC server first (with `context.WithTimeout`), then RabbitMQ/Memcached managers, then auth gRPC client, then DB.
- Frontend `nuxt.config.ts` sets `srcDir: 'src/'`. Auto-imports are configured for `~/store`, `~/utils/mutations`, and `~/composables/api`.
- Frontend constants and types live in `src/constants/` and `src/types/` — imported via `~/constants` and `~/types`.
