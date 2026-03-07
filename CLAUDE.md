# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Full-stack real-time messaging app. Monorepo with a **Go workspace** (backend services) and a **pnpm workspace** (frontend + shared JS packages). All services are orchestrated via Docker Compose.

## Commands

### Full-stack development (recommended)
```bash
# Start all services with hot-reload (Docker Compose watch mode)
docker compose watch
```

### Per-service development

**Backend (Go — from `apps/backend/`)**
```bash
make dev          # hot-reload with air
make build        # compile binary
make test         # run integration tests (requires Docker for Testcontainers)
make test-coverage
make lint         # golangci-lint
make fmt          # go fmt + goimports
make vet
make migrate-up   # run DB migrations (requires DATABASE_URL env)
make migrate-down
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

**Socket server (Node.js — from `apps/socket/`)**
```bash
pnpm dev          # ts-node-dev with hot-reload
pnpm build        # tsc
```

**Shared JS packages (from `packages/constants/` or `packages/types/`)**
```bash
pnpm build        # tsc
```

### Environment
Copy `.env.example` to `.env` before starting. All secrets and connection strings are env-only. The file documents every variable per service.

---

## Architecture

### Services

| Service | Language | Purpose | Protocol |
|---|---|---|---|
| `apps/auth` | Go | Auth microservice (sessions, OTP, JWT) | gRPC :50051 |
| `apps/backend` | Go | REST API server | HTTP :4000 |
| `apps/chat-worker` | Go | Message persistence worker | RabbitMQ consumer |
| `apps/socket` | TypeScript | Real-time WebSocket server | Socket.IO :4000 |
| `apps/frontend` | TypeScript (Nuxt 4) | SSR web client | HTTP :3000 |
| `apps/nginx` | — | Reverse proxy + TLS | HTTPS :7000 |
| `apps/loki/alloy/grafana/fluent-bit` | — | Centralized logging stack | — |

### Go workspace
`go.work` links: `apps/common`, `apps/auth`, `apps/backend`, `apps/chat-worker`.
- `apps/common` — shared domain models (`domain.go`), broker interfaces, constants. Import it as `github.com/arpansaha13/messaging-system/apps/common/...`.
- All Go services depend on the external library `github.com/arpansaha13/gotoolkit` (DB connection with backoff, HTTP/gRPC middleware, GORM logger). During local development the workspace resolves the `gotoolkit` module if its path is listed in `go.work`.

### pnpm workspace
`packages/constants` (`@shared/constants`) and `packages/types` (`@shared/types`) are workspace packages consumed by `apps/frontend` and `apps/socket`. Enforce pnpm via `preinstall` hook — don't use npm/yarn.

### Backend internal layout (`apps/backend/internal/`)
Strict layered architecture — each layer only depends on the one below it:
```
handler → service → repository → database (GORM)
```
- **`handler/`** — HTTP handlers; call service interfaces, never repositories directly.
- **`service/interfaces.go`** — all service interfaces defined here; handlers depend on interfaces, not concrete types (enables mocking in tests).
- **`repository/`** — all GORM queries; wrapped in circuit breakers (`internal/circuits`).
- **`app/app.go`** — server assembly: wires repos → services → handlers → router. Pass all deps through `app.Deps{}`. **Route registration order matters**: user-group routes must be registered before user routes (see comment in `app.go`).
- **`circuits/`** — circuit breakers for Postgres, RabbitMQ, and Auth gRPC using `gobreaker`. `gorm.ErrRecordNotFound` is treated as success (not an infra failure).

### Auth flow
`apps/auth` is a standalone gRPC service backed by its own PostgreSQL instance. `apps/backend` connects to it via gRPC and uses it through the `IAuthServiceClient` interface. The backend validates sessions on every protected request via `middleware.AuthMiddleware`.

### RabbitMQ event flow
```
backend → [fanout exchange] → socket server queues  (real-time delivery)
backend → [worker queue]   → chat-worker            (message persistence)
```
The socket server runs a subscription queue so clients can join group/channel rooms across server restarts. The chat-worker also handles `UserConnection` events for online/offline presence updates.

### Online status
Socket server tracks pings in-memory (`ChatsStoreService`) and flushes them to Memcached every 5 seconds. Presence TTL in Memcached is 60 seconds.

### Message lifecycle
1. Client sends a message via Socket.IO with a temporary hash.
2. Socket server publishes to RabbitMQ worker queue.
3. Chat-worker persists the message to Postgres, then publishes a delivery event back to the socket server queue.
4. Socket server emits the confirmed message (with real ID) to recipient, replacing the temporary message on the client.

### Logging pipeline
Go services → structured JSON (zap + OTel) → stdout → Fluent-bit → Kafka topic `application-logs` → Grafana Alloy → Loki → Grafana dashboards.

---

## Testing

**Backend integration tests** (`apps/backend/tests/`) use testify suite + Testcontainers (spins up a real Postgres container). Tests are isolated via table truncation in `SetupTest`. The mock auth service is in `tests/mocks/`. Run with `make test` from `apps/backend/`.

**Frontend unit tests** use Vitest with `@nuxt/test-utils` and `happy-dom`. Run with `pnpm test` from `apps/frontend/`.

**GORM logger** in tests is set to `Silent` mode to suppress query noise.

---

## Key conventions

- All Go services initialize GORM with `gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn)` — log at `Warn` level in production to surface slow queries/errors only.
- DB connections use `gotoolkit.ConnectPostgresWithBackoff` — exponential backoff on startup.
- RabbitMQ in backend auto-reconnects: a goroutine reads from a buffered channel signal and re-establishes the connection on disconnect.
- Frontend `nuxt.config.ts` sets `srcDir: 'src/'`. Auto-imports are configured for `~/store`, `~/utils/mutations`, and `~/composables/api`.
- `@shared/types` is a dev dependency in frontend (types only, not shipped) and a runtime-ish dep in socket server.
