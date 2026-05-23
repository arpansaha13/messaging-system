# Setup Scripts Sequence (from repo root)

Run all commands from the repository root:

```bash
cd /path/to/messaging-system
```

## macOS

### 1) General developer tooling

```bash
./tools/scripts/setup-mac-general.sh
```

### 2) Project dependencies (Node + Go modules)

```bash
./tools/scripts/setup-deps.sh
```

### 3) Containerization/Kubernetes tooling (only if you use Skaffold/Helm/K8s)

```bash
./tools/scripts/setup-mac-ctzn.sh
```

## Linux (Debian/Ubuntu)

### 1) General developer tooling

```bash
./tools/scripts/setup-linux-general.sh
```

### 2) Project dependencies (Node + Go modules)

```bash
./tools/scripts/setup-deps.sh
```

### 3A) Optional: local non-containerized dev infra

Installs local PostgreSQL, RabbitMQ, Memcached, creates local clusters/data dirs,
and runs auth/user/backend migrations.

```bash
./tools/scripts/setup-linux-local.sh
```

### 3B) Optional: local non-containerized resilience DB setup

Creates separate resilience PostgreSQL clusters/data dirs and runs
auth/user/backend migrations.

```bash
./tools/scripts/setup-linux-local-resilience.sh
```

## Notes

- `setup-deps.sh` is common for both macOS and Linux.
- Linux scripts above are Debian/Ubuntu oriented (`apt-get`, `systemctl`, `pg_createcluster`).
- `tools/scripts/migrate.sh` requires `DB_URL` for `up/down/status` actions.
- If you run Taskfile migrate commands directly, pass `DB_URL`, for example:

```bash
DB_URL='postgres://postgres@localhost:5432/messaging_db?sslmode=disable' task migrate:up SERVICE=backend
```
