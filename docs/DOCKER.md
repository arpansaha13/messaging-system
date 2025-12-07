# Docker Setup Guide

This project uses Docker and Docker Compose for containerized development and deployment.

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.5+ (with watch mode support)

### Start the entire stack

```bash
docker-compose watch --prune
```

This command:

- Starts all services (Postgres, Backend API, Frontend)
- Enables **watch mode** with auto-reload:
  - **Backend**: File changes trigger rebuild (src files)
  - **Frontend**: File changes sync and hot-reload (src + public files)
- Automatically removes orphaned containers with `--prune`

### Access the services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432

## Services

### PostgreSQL Database

- Container: `messaging-postgres`
- Port: `5432`
- Username: `postgres` (configurable)
- Password: `postgres` (configurable)
- Database: `messaging_db` (configurable)
- Volume: `postgres_data` (persistent)

### Backend API Server

- Container: `messaging-backend`
- Port: `4000`
- Framework: Express.js + TypeORM
- Watch Mode: Rebuilds on `src/` changes
- Dependencies: TypeORM migrations run automatically on startup
- Logs: View with `docker logs messaging-backend -f`

### Frontend Client

- Container: `messaging-client`
- Port: `3000`
- Framework: Next.js
- Watch Mode: Syncs files with hot-reload on `src/` and `public/` changes
- Logs: View with `docker logs messaging-client -f`

## Common Commands

### Build services without starting

```bash
docker-compose build
```

### Start services (without watch mode)

```bash
docker-compose up
```

### Stop all services

```bash
docker-compose down
```

### View logs for a specific service

```bash
docker-compose logs backend -f     # Backend logs
docker-compose logs client -f      # Frontend logs
docker-compose logs postgres -f    # Database logs
```

### Access a container shell

```bash
docker-compose exec backend sh     # Backend shell
docker-compose exec client sh      # Frontend shell
docker-compose exec postgres psql -U postgres  # PostgreSQL CLI
```

### Run database migrations manually

```bash
docker-compose exec backend pnpm run migrate:run
```

### Clean up everything (including volumes)

```bash
docker-compose down -v
```

## Environment Variables

Configuration is managed via `.env` file in the project root:

```env
# PostgreSQL Configuration
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=messaging_db

# Backend Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend Configuration
API_BASE_URL=http://localhost:4000
```

## Watch Mode Details

### Backend Watch Configuration

- **Action**: `rebuild`
- **Path**: `apps/backend/src`
- **Behavior**: Detects TypeScript changes, rebuilds dist, restarts container

### Frontend Watch Configuration

- **Action**: `sync`
- **Paths**: `apps/client/src` and `apps/client/public`
- **Behavior**: Syncs files directly, Next.js hot-reload applies changes instantly
- **Ignored**: `node_modules`

## Troubleshooting

### Port already in use

If ports 3000, 4000, or 5432 are in use, modify `compose.yaml`:

```yaml
ports:
  - '3001:3000' # Frontend on 3001 instead
  - '4001:4000' # Backend on 4001 instead
  - '5433:5432' # Postgres on 5433 instead
```

### Database won't initialize

```bash
# Remove the Postgres volume and restart
docker-compose down -v
docker-compose watch --prune
```

### Watch mode not detecting changes

```bash
# Restart watch mode
Ctrl+C  (stop the current session)
docker-compose watch --prune
```

### Service won't start

```bash
# Check logs
docker-compose logs <service-name> -f

# Rebuild and start fresh
docker-compose build --no-cache
docker-compose watch --prune
```

## Performance Notes

- **Volume Mounts**: `node_modules` are excluded from sync to avoid permission issues
- **Multi-stage Builds**: Both Dockerfiles use multi-stage builds to reduce final image size
- **Hot Reload**: Frontend uses Next.js built-in hot-reload; backend rebuilds on file changes
- **Network**: Services communicate via `messaging-network` bridge network

## Production Deployment

For production, use a separate `compose.prod.yaml` with:

- Optimized builds (no watch mode)
- Environment-specific secrets management
- Reverse proxy (nginx)
- SSL/TLS certificates
- Database backups

Example structure:

```bash
docker-compose -f compose.yaml build
docker image tag backend:latest myregistry/backend:v1.0.0
docker push myregistry/backend:v1.0.0
```
