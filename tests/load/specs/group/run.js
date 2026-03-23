import { spawnSync } from 'node:child_process'
import { TEST_USERS } from '../../fixtures/users.js'
import { cleanupUsers, seedUsers } from '../../helpers/db.js'

const USERS = [TEST_USERS.alice, TEST_USERS.bob]
const EMAILS = USERS.map(user => user.email)
const AUTH_DB_URL = 'postgres://testuser:testpass@localhost:7511/auth_load_db?sslmode=disable'
const MESSAGING_DB_URL = 'postgres://testuser:testpass@localhost:7521/messaging_load_db?sslmode=disable'
const GOAUTHKIT_MIGRATIONS_DIR = process.env.GOAUTHKIT_MIGRATIONS_DIR || '../../../goauthkit/migrations'
const MESSAGING_MIGRATIONS_DIR = '../../apps/backend/migrations'

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' })
  return result
}

function runMigrations() {
  const authResult = run('migrate', ['-path', GOAUTHKIT_MIGRATIONS_DIR, '-database', AUTH_DB_URL, 'up'])
  if (authResult.error) {
    throw new Error(`Failed to run auth migrations: ${authResult.error.message}`)
  }
  if (authResult.status !== 0) {
    throw new Error('Auth migrations failed')
  }

  const msgResult = run('migrate', ['-path', MESSAGING_MIGRATIONS_DIR, '-database', MESSAGING_DB_URL, 'up'])
  if (msgResult.error) {
    throw new Error(`Failed to run messaging migrations: ${msgResult.error.message}`)
  }
  if (msgResult.status !== 0) {
    throw new Error('Messaging migrations failed')
  }
}

let exitCode = 0
let seeded = false

try {
  runMigrations()
  await seedUsers(USERS)
  seeded = true

  const result = spawnSync('k6', ['run', 'specs/group/group.k6.js'], { stdio: 'inherit' })
  exitCode = result.status ?? 1
} catch (error) {
  console.error('[load:group] Failed to seed or run k6:', error)
  exitCode = 1
} finally {
  if (seeded) {
    try {
      await cleanupUsers(EMAILS)
    } catch (error) {
      console.error('[load:group] Cleanup failed:', error)
      exitCode = 1
    }
  }
}

process.exit(exitCode)
