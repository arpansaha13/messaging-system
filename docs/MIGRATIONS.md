# TypeORM CLI Setup Guide for Backend

This directory contains a complete Express + TypeORM backend with CLI-driven database migrations.

## Quick Migration Commands

### Using npm/pnpm scripts

```bash
# Install deps and run migrations
pnpm install
pnpm run migrate:run

# Start dev server
pnpm run dev
```

### Using migration helper scripts

**On Windows (Node.js):**

```bash
node scripts/migrate.js run       # Run pending migrations
node scripts/migrate.js revert    # Revert last migration
node scripts/migrate.js show      # Show migration status
```

**On Unix/Linux/Mac (Bash):**

```bash
chmod +x scripts/migrate.sh       # Make executable (first time only)
./scripts/migrate.sh run          # Run pending migrations
./scripts/migrate.sh revert       # Revert last migration
./scripts/migrate.sh show         # Show migration status
```

## How TypeORM CLI Works

1. **Data Source** (`src/data-source.ts`) defines the database connection and all entities
2. **TypeORM CLI** reads this file (compiled to `dist/data-source.js`) to run migrations
3. **Configuration** is in `ormconfig.json` at the project root
4. **Migrations** are stored in `src/migrations/` and auto-compiled to `dist/migrations/`

## Migration Workflow

### Run pending migrations

```bash
pnpm run migrate:run
```

This compiles TypeScript and runs all pending migrations in the database.

### Revert last migration

```bash
pnpm run migrate:revert
```

Rolls back the most recently executed migration.

### Check migration status

```bash
pnpm run migrate:show
```

Shows which migrations are pending vs executed.

### Create a new migration (manual)

```bash
pnpm run migrate:create
# Then edit the created file in src/migrations/
```

### Generate migration from entity changes (auto-detect)

```bash
pnpm run migrate:generate
```

After modifying entities in `src/models/`, TypeORM can auto-generate the migration SQL.

## File Structure

```
apps/backend/
├── src/
│   ├── data-source.ts         # TypeORM DataSource config (used by CLI)
│   ├── index.ts               # Express app entry point
│   ├── models/                # TypeORM Entities
│   ├── repositories/          # Data access layer
│   ├── services/              # Business logic
│   ├── controllers/           # Express route handlers
│   ├── middleware/            # Express middleware (auth, etc)
│   └── migrations/            # Database migration files
├── dist/                      # Compiled JavaScript (generated)
├── scripts/
│   ├── migrate.js            # Cross-platform migration helper (Node.js)
│   └── migrate.sh            # Unix/Linux migration helper (Bash)
├── ormconfig.json            # TypeORM CLI configuration
├── tsconfig.json             # TypeScript compiler config
├── package.json              # Dependencies and scripts
└── README.md                 # Quick start guide
```

## Environment Setup

Create a `.env` file in `apps/backend/` (optional, uses defaults):

```bash
PORT=4000
DB_PATH=backend.sqlite
DB_LOGGING=false
JWT_SECRET=your-secret-key
AUTH_COOKIE_NAME=msess
JWT_TOKEN_VALIDITY_SECONDS=86400
```

## Troubleshooting

### "Cannot find module 'dist/data-source.js'"

Make sure to run `pnpm run build` before running migrations, or use `pnpm run migrate:run` which automatically builds first.

### "Migrations directory not found"

TypeORM CLI expects compiled migrations in `dist/migrations/`. Ensure TypeScript is compiled.

### Database is locked (SQLite)

Close other connections to the database file and ensure dev server is stopped before running migrations.

### Using with Postgres

1. Install: `pnpm add pg`
2. Update `src/data-source.ts` with Postgres connection details
3. Regenerate migrations for Postgres schema if needed
4. Re-run `pnpm run migrate:run`
