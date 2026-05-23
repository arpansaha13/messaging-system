# Service Ports By Environment

This document summarizes which services are reachable on host ports in each local environment, and which ones are internal-only (not port-forwarded / not host-published).

## 1) Dev Environment (Kubernetes via Skaffold)

Source: `skaffold.yaml` `portForward:`

Local port-forwards configured:

- `7000 -> ingress-nginx-controller:80`
- `7030 -> backend service:4000`
- `7010 -> auth-db service:5432`
- `7020 -> postgres service:5432`
- `7040 -> user-db service:5432`
- `7050 -> rabbitmq service:15672`

Not port-forwarded by default:

- `auth` gRPC service (`50051`)
- `user` service ports
- `socket` service
- `frontend` service
- `chat-worker`
- `memcached` / `auth-cache`
- RabbitMQ AMQP (`5672`)

These remain reachable only inside cluster networking unless you add explicit `kubectl port-forward` / Skaffold `portForward` entries.

## 2) Integration Tests (Go microservice integration suites)

Source: Go test setup + `apps/common/testdeps`

### Container mode (`TEST_DEPS_MODE` unset or `container`)

- Postgres containers are started dynamically by Testcontainers.
- Host ports are dynamic/ephemeral (mapped at runtime), not fixed.
- No fixed host port contract should be assumed.

### External mode (`TEST_DEPS_MODE=external`)

- Tests read service-specific DSNs from env (`TEST_POSTGRES_DSN_AUTH`, `TEST_POSTGRES_DSN_BACKEND`, `TEST_POSTGRES_DSN_USER`, `TEST_POSTGRES_DSN_CHAT_WORKER`).
- Host ports depend on your DSN values.
- This repo's `.env.test` uses dedicated local integration ports from `tools/scripts/setup-linux-local-integration.sh` (`6433`, `6432`, `6434`).

Not port-forwarded / not auto-exposed by integration tests:

- Non-DB dependencies are mostly mocked in suites; tests do not require publishing every service port.

## 3) E2E Test Environment

Source: `compose.test.yaml` profile `e2e`, `tests/e2e/playwright.config.ts`

Host-exposed ports:

- `7500 -> nginx:80` (Playwright base URL)
- `7511 -> auth-db:5432`
- `7521 -> postgres:5432`
- `7530 -> backend:4000`
- `7540 -> socket:4000`
- `7541 -> auth:50051` (gRPC)
- `7544 -> auth:4000` (HTTP)
- `7542 -> memcached:11211`
- `7543 -> auth-cache:11211`
- `7551 -> rabbitmq:15672`

Internal-only (not host-published):

- RabbitMQ AMQP `5672` (internal network only)
- Frontend container port (served through nginx at `7500`)
- Chat-worker has no published host port

## 4) Resilience Test Environment

Source: `compose.test.yaml` profile `resilience`, `tests/resilience/helpers/config.ts`

Profile reuses the same compose service definitions/ports as above for services included in `resilience` profile.

Primary host endpoints used by resilience tests:

- `http://localhost:7530` (backend)
- `http://localhost:7544` (auth HTTP)
- `http://localhost:7540` (socket)
- `localhost:7541` (auth gRPC)
- `localhost:7511` (auth DB)
- `localhost:7521` (messaging DB)
- `localhost:7542` (memcached)
- `localhost:7543` (auth-cache)

Not port-forwarded / not host-published for resilience profile:

- Nginx `7500` is not part of resilience profile usage path.
- Frontend and chat-worker are not required by resilience profile.
- RabbitMQ AMQP `5672` remains internal-only.

## 5) Load Test Environment

Source: `compose.test.yaml` profile `load`, `tests/load/specs/*/run.js`

Host-exposed ports used by load tests:

- `7500 -> nginx:80` (single-origin entry)
- `7511 -> auth-db:5432`
- `7521 -> postgres:5432`
- `7530 -> backend:4000`
- `7540 -> socket:4000`
- `7541 -> auth:50051`
- `7544 -> auth:4000`
- `7542 -> memcached:11211`
- `7543 -> auth-cache:11211`
- `7551 -> rabbitmq:15672`

Not port-forwarded / not host-published:

- RabbitMQ AMQP `5672` is internal-only.
- Chat-worker has no host-published port.
- Frontend is not part of `load` profile; nginx is used as the ingress-like entrypoint.

---

## Quick Notes

- `expose:` in Compose means container-network visibility only, not host visibility.
- For Kubernetes dev, only services in `skaffold.yaml` `portForward` are available on localhost by default.
