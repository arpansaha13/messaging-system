# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Full-stack real-time messaging app. Monorepo with a **Go workspace** (backend services) and a **pnpm workspace** (frontend + tests + tools). Development is orchestrated via **Skaffold + Helm** on a local Kubernetes cluster.

## Commands

### Full-stack development (recommended)

```bash
# Start all app services in Kubernetes with hot-reload (Skaffold)
pnpm dev
# Or equivalently:
skaffold dev --no-prune=false --cache-artifacts=false
```

> Deploys to the `messaging-dev` namespace via the Helm chart in `infra/helm/`. A pre-deploy hook (`infra/helm/scripts/apply-env.sh`) reads `.env` and creates a ConfigMap + Secret in the namespace. Port-forwards are configured in `skaffold.yaml` (nginx :7000, backend :7030, auth-db :7010, postgres :7020, user-db :7040, rabbitmq-mgmt :7050). See `docs/kubernetes-development.md` for Headlamp UI access and volume reset instructions.

### Setup & code generation

```bash
# Verify / install required tools (protoc, task, migrate, skaffold, helm, kubectl, headlamp)
bash tools/scripts/setup.sh

# Generate Go code from protobuf definitions in apps/common/proto/
bash tools/scripts/protoc-gen.sh
```

### Database migrations (Taskfile)

Migrations are managed via [go-task](https://taskfile.dev/) (`Taskfile.yml` at project root). Supports the `backend` and `user` services (connecting to ports :7020 and :7040 respectively). Requires `migrate` CLI and a running database.

```bash
task migrate:up                      # run all pending migrations for all services
task migrate:up SERVICE=backend      # run for a single service
task migrate:down                    # rollback last migration for all services
task migrate:down SERVICE=user       # rollback for a single service
task migrate:status                  # show current migration version
task migrate:create SERVICE=backend NAME=add_fields  # create new migration file
```

### Per-service development

**Backend (Go — from `apps/backend/server/`)**

```bash
go run ./cmd/server          # run directly
go build -o bin/server ./cmd/server  # compile binary
go test ./tests/... -timeout 300s    # run integration tests (default: TEST_DEPS_MODE=container)
go test ./tests/... -coverprofile=coverage.out -timeout 300s  # with coverage
golangci-lint run            # lint
go fmt ./...                 # format
go vet ./...                 # vet
```

**User service (Go — from `apps/user/`)**

```bash
go run ./cmd/main.go         # run directly (serves gRPC + HTTP)
go test ./tests/... -timeout 300s    # run integration tests (default: TEST_DEPS_MODE=container)
```

**Integration dependency switching (all Go services)**

```bash
task test:integration  # container mode (default)
TEST_DEPS_MODE=external \
  TEST_POSTGRES_DSN_AUTH='host=localhost port=7511 user=testuser password=testpass dbname=test_auth sslmode=disable' \
  TEST_POSTGRES_DSN_BACKEND='host=localhost port=7020 user=user password=password dbname=messaging_db sslmode=disable' \
  TEST_POSTGRES_DSN_USER='host=localhost port=7040 user=user password=password dbname=users_db sslmode=disable' \
  TEST_POSTGRES_DSN_CHAT_WORKER='host=localhost port=7020 user=user password=password dbname=messaging_db sslmode=disable' \
  task test:integration:external
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

### Resilience tests (Vitest — from `tests/resilience/`)

```bash
pnpm test              # build images, start resilience stack, run all specs, teardown
pnpm setup             # build images and start resilience stack only
pnpm run               # run specs (after setup, skip rebuild)
pnpm teardown          # tear down the stack
# Direct runner (after setup):
./run-resilience.sh [--spec <path>] [--skip-migrations] [--no-teardown]
```

> Uses `compose.test.yaml --profile resilience`. Specs in `tests/resilience/specs/` cover `auth`, `backend`, and `socket` services.

### Environment

Copy `.env.example` to `.env` before starting. All secrets and connection strings are env-only. The file documents every variable per service.

---

## Architecture

### Services

| Service                              | Language            | Purpose                                      | Protocol           |
| ------------------------------------ | ------------------- | -------------------------------------------- | ------------------ |
| `apps/auth/server`                   | Go                  | Auth microservice (sessions, OTP, JWT, OAuth) | gRPC :50051       |
| `apps/user`                          | Go                  | User profiles + contacts microservice         | gRPC :50051 + HTTP :4000 |
| `apps/backend/server`                | Go                  | REST API server                              | HTTP :4000         |
| `apps/chat-worker`                   | Go                  | Status updates + presence worker             | RabbitMQ consumer  |
| `apps/socket`                        | Go                  | Real-time WebSocket server                   | WebSocket :4000    |
| `apps/frontend`                      | TypeScript (Nuxt 4) | SSR web client                               | HTTP :3000         |
| `apps/nginx`                         | —                   | Reverse proxy + TLS                          | HTTPS :7000        |
| `apps/observability/loki/alloy/grafana/fluent-bit` | —       | Centralized logging stack                    | —                  |
| `apps/observability/prometheus`                     | —       | Metrics scraping (metrics profile)           | HTTP :9090         |
| `apps/observability/tempo`                          | —       | Distributed trace backend                    | gRPC :4317         |

### Go workspace

`go.work` links: `apps/common`, `apps/auth/server`, `apps/backend/server`, `apps/chat-worker`, `apps/socket`, `apps/user`.

- `apps/common` — shared domain models (`domain/models.go`), broker interfaces/payloads, constants, and **protobuf definitions** (`proto/` → generated code in `pb/`). Import as `github.com/arpansaha13/messaging-system/apps/common/...`.
- All Go services depend on the external library `github.com/arpansaha13/gotoolkit` (DB connection with backoff, HTTP/gRPC middleware, connection managers, GORM logger). During local development the workspace resolves the `gotoolkit` module if its path is listed in `go.work`.

### pnpm workspace

Workspace packages: `apps/frontend`, `tools/seed`, `tests/e2e`, `tests/load`, `tests/resilience`. Enforce pnpm via `preinstall` hook — don't use npm/yarn. Constants and types that were previously in `packages/constants` and `packages/types` are now co-located in `apps/frontend/src/constants/` and `apps/frontend/src/types/`.

### Kubernetes / Helm (development)

The Helm chart lives in `infra/helm/`. Skaffold builds images locally and deploys them via the chart to the `messaging-dev` namespace.

- `infra/helm/scripts/apply-env.sh` — pre-deploy hook that reads `.env`, splits variables into a ConfigMap (`messaging-env`) and a Secret (`messaging-secret`), and applies them to the namespace.
- `infra/helm/templates/` — Deployments (Go services, frontend, memcached), StatefulSets (Postgres DBs, RabbitMQ), Services, and Ingress (nginx ingress class).
- `infra/helm/values.yaml` — image refs, replica counts, persistence hostPaths (under `/tmp/messaging-system-k8s/`), ingress config.
- Database volumes use local hostPath PVs. To reset: delete the hostPath directory and force-delete the StatefulSet pod (see `docs/kubernetes-development.md`).


### Backend internal layout (`apps/backend/server/internal/`)

Strict layered architecture — each layer only depends on the one below it:

```
handler → service → repository → database (GORM)
```

- **`handler/`** — HTTP handlers; call service interfaces, never repositories directly.
- **`service/interfaces.go`** — all service interfaces defined here (`IAuthServiceClient`, `IUserServiceClient`, `IChatService`, `IMessageService`, `IChannelService`, `IGroupService`, `IInviteService`, `IUserGroupService`); handlers depend on interfaces, not concrete types.
- **`repository/`** — all GORM queries; wrapped in circuit breakers (`internal/circuits`).
- **`app/setup_router.go`** — `SetupRouter(deps Deps) *mux.Router`: wires repos → services → handlers → router. Pass all deps through `app.Deps{}`. Creates an `apiRouter` subrouter via `router.PathPrefix("/api")` — handlers register paths **without** the `/api` prefix; health check is at `/api/livez`. **Route registration order matters**: user-group routes must be registered before user routes.
- **`app/setup_postgres.go`**, **`app/setup_chat_broker.go`**, **`app/setup_auth.go`**, **`app/setup_user.go`** — `Setup*` functions called from `main.go`; return only what `main` needs for injection or graceful shutdown.
- **`app/setup_chat_broker.go`** — creates a `ChatBroker` with a `gtk.ConnectionManager` for auto-reconnect; the disconnect handler calls `connMgr.Signal()` to trigger reconnect.
- **`app/setup_user.go`** — establishes a managed gRPC connection to the user service via `gtk.ConnectionManager`.
- **`circuits/`** — circuit breakers for Postgres, RabbitMQ, Auth gRPC, and User gRPC using `gobreaker`. `gorm.ErrRecordNotFound` is treated as success (not an infra failure).

### User service internal layout (`apps/user/internal/`)

Layered architecture similar to backend but serves both gRPC and HTTP:

```
controller (gRPC) / handler (HTTP) → service → repository → database (GORM)
```

- **`app/deps.go`** — `Dependencies` struct holding `UserProfileService`, `ContactService`, `AuthClient`, `ContactRepo`.
- **`app/setup_grpc_server.go`** — registers `UserProfileController` as a gRPC service on the common protobuf `UserProfileServiceServer`. Uses `otelgrpc.NewServerHandler()` + gotoolkit interceptors (recovery, logger, error).
- **`app/setup_http_server.go`** — `SetupRouter(deps, logger)`: creates `apiRouter` under `/api` prefix, applies auth middleware on protected routes. Health check at `/livez`. Registers user and contact HTTP routes.
- **`app/setup_auth.go`**, **`app/setup_db.go`** — standard `Setup*` pattern.
- **`controller/`** — gRPC controllers implementing protobuf service interfaces.
- **`handler/`** — HTTP handlers for user profiles and contacts.
- **`service/auth_client.go`** — `IAuthServiceClient` interface for session validation.
- **`domain/`** — domain model (`UserProfile`).
- **`middleware/auth.go`** — validates session via gRPC auth service.
- **`circuits/`** — circuit breakers for Postgres.
- Has its own `migrations/` directory and integration tests in `tests/`.

### Shared protobuf (`apps/common/proto/` → `apps/common/pb/`)

Shared gRPC service definitions live in `apps/common/proto/`. Generated Go code goes to `apps/common/pb/`. Currently defines `UserProfileService` (Create, Get, GetMultiple, Update, Search user profiles). Both the `user` service (server) and `backend`/`auth` services (clients) import from `apps/common/pb`.

Generate with: `bash tools/scripts/protoc-gen.sh` (from project root).

### Socket internal layout (`apps/socket/internal/`)

- **`app/setup_router.go`** — `SetupRouter(deps Deps) *mux.Router`: all socket routes under `router.PathPrefix("/ws")` subrouter; auth middleware applied to the protected sub-router.
- **`app/setup_auth.go`**, **`app/setup_presence_cache.go`**, **`app/setup_chat_broker.go`** — `Setup*` functions called from `main.go`; same pattern as backend.
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

`apps/auth/server` is a standalone gRPC service backed by its own PostgreSQL instance (`auth-db`). It connects to the `user` service via `USER_SERVICE_GRPC_ADDR` to manage user profiles on registration. `apps/backend/server` connects to auth via gRPC and uses it through the `IAuthServiceClient` interface. The backend validates sessions on every protected request via `middleware.AuthMiddleware`.

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
- Tracing is off when `OTLP_ENDPOINT` is unset (no-op TracerProvider). Set to `tempo:4317` in the Helm chart / `.env`.
- Grafana dashboards are provisioned from `apps/observability/grafana/provisioning/dashboards/`. Dashboard variables use `job` label to identify targets; DB dashboards hardcode `job` as a hidden constant (`postgres-auth-db` / `postgres-backend-db`).

### Logging pipeline

Go services → structured JSON (zap + OTel) → stdout → Fluent-bit → Kafka topic `application-logs` → Grafana Alloy → Loki → Grafana dashboards.

---

## Testing

**Backend integration tests** (`apps/backend/server/tests/`) use testify suite with a shared dependency resolver. Default mode (`TEST_DEPS_MODE` unset or `container`) starts a real Postgres via Testcontainers; `TEST_DEPS_MODE=external` uses env-provided Postgres DSN. Tests are isolated via table truncation in `SetupTest`. The mock auth service is in `tests/mocks/`. Run with `go test ./tests/...` from `apps/backend/server/`.

**User service integration tests** (`apps/user/tests/`) follow the same dependency-mode pattern as backend (`container` default, `external` optional). Mock auth in `tests/mocks/`.

**Frontend unit tests** use Vitest with `@nuxt/test-utils` and `happy-dom`. Run with `pnpm test` from `apps/frontend/`.

**GORM logger** in tests is set to `Silent` mode to suppress query noise.

**E2E tests** (`tests/e2e/`) use Playwright against a full Docker Compose stack (`compose.test.yaml`).

- Stack: nginx (:7500 HTTP-only), auth, backend, socket, frontend, chat-worker, RabbitMQ, Postgres, Memcached.
- `global-setup.ts` seeds test users; `global-teardown.ts` cleans up.
- State isolation: each spec resets via DB helpers (`tests/e2e/helpers/db.ts`) and fresh Playwright browser contexts.
- Fixtures: `auth.fixture.ts` provides pre-logged-in pages for two users (Alice/Bob pattern).
- Auth-DB (:7511) is accessible from the host for OTP retrieval in login flows.

**Resilience tests** (`tests/resilience/`) use Vitest against `compose.test.yaml --profile resilience`. Specs cover auth, backend, and socket service resilience (reconnect, circuit-breaker behaviour). Runner script `run-resilience.sh` handles migrations, test execution, and teardown.

---

## Key conventions

- All Go services initialize GORM with `gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn)` — log at `Warn` level in production to surface slow queries/errors only.
- DB connections use `gotoolkit.ConnectPostgresWithBackoff` — exponential backoff on startup.
- RabbitMQ and gRPC clients auto-reconnect via `gotoolkit.ConnectionManager`; a disconnect handler calls `connMgr.Signal()` to trigger reconnect.
- All Go services follow the `internal/app/Setup*` pattern: each external dependency has its own `Setup*` function in `internal/app/`; `main.go` calls them and constructs the HTTP/gRPC server itself. `Setup*` functions return only what `main` needs for injection or graceful shutdown.
- Graceful shutdown order in all services: HTTP/gRPC server first (with `context.WithTimeout`), then connection managers (RabbitMQ, Memcached, user gRPC), then auth gRPC client, then DB.
- Frontend `nuxt.config.ts` sets `srcDir: 'src/'`. Auto-imports are configured for `~/store`, `~/utils/mutations`, and `~/composables/api`.
- Frontend constants and types live in `src/constants/` and `src/types/` — imported via `~/constants` and `~/types`.
- Shared protobuf definitions live in `apps/common/proto/`; generated Go code in `apps/common/pb/`. Regenerate with `bash tools/scripts/protoc-gen.sh`.
