import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { TEST_USERS } from '../fixtures/users'
import { stopService, startService, waitServiceHealthy } from '../helpers/compose'
import { ensureTestUser } from '../helpers/db'
import { login } from '../helpers/auth'
import { closeClient, createAuthCacheClient, getKey } from '../helpers/memcached'
import { poll } from '../helpers/poll'

const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY ?? 'test-secret-key-32-chars-minimum!'

describe.sequential('auth resilience', () => {
  beforeAll(async () => {
    await waitServiceHealthy('auth-db_test')
    await waitServiceHealthy('auth-cache_test')
    await waitServiceHealthy('auth_test')

    const alice = TEST_USERS.alice
    const aliceHash = await bcrypt.hash(alice.password, 10)
    await ensureTestUser({
      email: alice.email,
      username: 'alice',
      passwordHash: aliceHash,
      globalName: alice.globalName,
    })
  })

  beforeEach(async () => {
    startService('auth-db')
    startService('auth-cache')
    await waitServiceHealthy('auth-db_test')
    await waitServiceHealthy('auth-cache_test')
  })

  afterAll(async () => {
    startService('auth-db')
    startService('auth-cache')
    await waitServiceHealthy('auth-db_test')
    await waitServiceHealthy('auth-cache_test')
  })

  it('auth-db outage returns failure then heals', async () => {
    const alice = TEST_USERS.alice
    const baseline = await login(alice.email, alice.password)
    expect(baseline).toBeTruthy()

    stopService('auth-db')
    let error: Error | null = null
    try {
      await login(alice.email, alice.password)
    } catch (err) {
      error = err as Error
    }
    expect(error).toBeTruthy()
    expect(error!.message).toMatch(/Login failed \((500|502|503|504)\)/)

    startService('auth-db')
    await waitServiceHealthy('auth-db_test')

    await poll(
      async () => {
        try {
          await login(alice.email, alice.password)
          return true
        } catch {
          return false
        }
      },
      (ok) => ok,
      { description: 'auth-db recovery' },
    )
  })

  it('auth-cache outage degrades cache but login still succeeds', async () => {
    const alice = TEST_USERS.alice
    const sessionToken = await login(alice.email, alice.password)
    expect(sessionToken).toBeTruthy()

    const tokenHash = hashSessionToken(sessionToken)
    const cacheKey = `session:${tokenHash}`
    await poll(
      async () => {
        const cacheClient = createAuthCacheClient()
        try {
          const cached = await getKey(cacheClient, cacheKey)
          return cached !== null
        } catch {
          return false
        } finally {
          await closeClient(cacheClient)
        }
      },
      (ok) => ok,
      { timeoutMs: 20_000, intervalMs: 1_000, description: 'auth-cache baseline key exists' },
    )

    stopService('auth-cache')
    const downClient = createAuthCacheClient()
    let cacheUnavailable = false
    try {
      const value = await getKey(downClient, cacheKey)
      cacheUnavailable = value === null
    } catch {
      cacheUnavailable = true
    } finally {
      await closeClient(downClient)
    }
    expect(cacheUnavailable).toBe(true)

    const degradedLogin = await login(alice.email, alice.password)
    expect(degradedLogin).toBeTruthy()

    startService('auth-cache')
    await waitServiceHealthy('auth-cache_test')

    await poll(
      async () => {
        const token = await login(alice.email, alice.password)
        const latestHash = hashSessionToken(token)
        const client = createAuthCacheClient()
        try {
          const value = await getKey(client, `session:${latestHash}`)
          return Boolean(token) && value !== null
        } catch {
          return false
        } finally {
          await closeClient(client)
        }
      },
      (ok) => ok,
      { timeoutMs: 45_000, description: 'auth-cache recovery' },
    )
  })
})

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token + AUTH_SECRET_KEY).digest('hex')
}
