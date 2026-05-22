import bcrypt from 'bcryptjs'
import { TEST_USERS } from '../fixtures/users'
import { login } from '../helpers/auth'
import { stopService, startService, waitServiceHealthy } from '../helpers/compose'
import { ensureTestUser } from '../helpers/db'
import { backendFetch } from '../helpers/http'
import { poll, sleep } from '../helpers/poll'

const POSTGRES_OUTAGE_STATUSES = new Set([500, 503])
const RABBITMQ_OUTAGE_STATUSES = new Set([500, 503])

describe.sequential('backend resilience', () => {
  let aliceSession = ''

  beforeAll(async () => {
    startService('backend')
    await waitServiceHealthy('postgres_test')
    await waitServiceHealthy('auth_test')
    await waitServiceHealthy('rabbitmq_test')
    await waitForBackendLivez()

    const alice = TEST_USERS.alice
    const bob = TEST_USERS.bob
    const aliceHash = await bcrypt.hash(alice.password, 10)
    const bobHash = await bcrypt.hash(bob.password, 10)

    await ensureTestUser({
      email: alice.email,
      username: 'alice',
      passwordHash: aliceHash,
      globalName: alice.globalName,
    })
    await ensureTestUser({
      email: bob.email,
      username: 'bob',
      passwordHash: bobHash,
      globalName: bob.globalName,
    })

    aliceSession = await waitForBackendLogin()
  })

  beforeEach(async () => {
    try {
      stopService('backend')
    } catch {
      // backend can already be stopped on the first run
    }
    startService('backend')
    startService('postgres')
    startService('auth')
    startService('rabbitmq')
    await waitServiceHealthy('postgres_test')
    await waitServiceHealthy('auth_test')
    await waitServiceHealthy('rabbitmq_test')
    await waitForBackendLivez()
  })

  afterAll(async () => {
    startService('backend')
    startService('postgres')
    startService('auth')
    startService('rabbitmq')
    await waitServiceHealthy('postgres_test')
    await waitServiceHealthy('auth_test')
    await waitServiceHealthy('rabbitmq_test')
    await waitForBackendLivez()
  })

  it('postgres outage returns dependency error then heals', async () => {
    const baseline = await getChats(aliceSession)
    expect(baseline.status).toBe(200)

    stopService('postgres')
    await sleep(1_000)
    const down = await getChats(aliceSession)
    expect(POSTGRES_OUTAGE_STATUSES.has(down.status)).toBe(true)

    startService('postgres')
    await waitServiceHealthy('postgres_test')

    await poll(
      async () => {
        const res = await getChats(aliceSession)
        return res.status
      },
      (status) => status === 200,
      { description: 'postgres recovery' },
    )
  })

  it('auth outage returns 503 then heals', async () => {
    const controlInvalid = await getChats('invalid-token')
    expect(controlInvalid.status).toBe(401)

    const baseline = await getChats(aliceSession)
    expect(baseline.status).toBe(200)

    stopService('auth')
    await sleep(1_000)

    await poll(
      async () => {
        try {
          const res = await getChats(aliceSession)
          return res.status
        } catch {
          return 0
        }
      },
      (status) => status === 503,
      { timeoutMs: 25_000, intervalMs: 1_000, description: 'auth outage status=503' },
    )

    startService('auth')
    await waitServiceHealthy('auth_test')

    await poll(
      async () => {
        try {
          const res = await getChats(aliceSession)
          return res.status
        } catch {
          return 0
        }
      },
      (status) => status === 200,
      { description: 'auth recovery' },
    )
  })

  it(
    'rabbitmq outage returns dependency error then heals',
    async () => {
    const baseline = await postReadAck(aliceSession)
    expect(baseline.status).toBe(200)

    stopService('rabbitmq')
    await sleep(1_000)

    await poll(
      async () => {
        try {
          const res = await postReadAck(aliceSession)
          return res.status
        } catch {
          return 0
        }
      },
      (status) => status === 0 || RABBITMQ_OUTAGE_STATUSES.has(status),
      { timeoutMs: 25_000, intervalMs: 1_000, description: 'rabbitmq outage status' },
    )

    startService('rabbitmq')
    startService('postgres')
    startService('auth')
    try {
      stopService('backend')
    } catch {
      // backend might already be stopped by dependency churn
    }
    startService('backend')
    await waitServiceHealthy('rabbitmq_test')
    await waitServiceHealthy('postgres_test')
    await waitServiceHealthy('auth_test')
    await waitForBackendLivez(120_000)

    await poll(
      async () => {
        return postReadAckWithFreshLogin()
      },
      (status) => status === 200,
      { timeoutMs: 120_000, intervalMs: 1_000, description: 'rabbitmq recovery' },
    )
    },
    360_000,
  )
})

async function waitForBackendLivez(timeoutMs = 30_000): Promise<void> {
  await poll(
    async () => {
      try {
        const res = await backendFetch('/api/livez')
        return res.status
      } catch {
        return 0
      }
    },
    (status) => status === 200,
    { timeoutMs, intervalMs: 1_000, description: 'backend livez' },
  )
}

async function waitForBackendLogin(): Promise<string> {
  return poll(
    async () => {
      try {
        return await login(TEST_USERS.alice.email, TEST_USERS.alice.password)
      } catch {
        return ''
      }
    },
    (token) => token.length > 0,
    { timeoutMs: 120_000, intervalMs: 1_000, description: 'backend login readiness' },
  )
}

async function getChats(sessionToken: string): Promise<Response> {
  return backendFetch('/api/chats', {
    headers: { Cookie: `session=${sessionToken}` },
  })
}



async function postReadAck(sessionToken: string): Promise<Response> {
  return backendFetch('/api/messages/status/read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session=${sessionToken}`,
    },
    body: JSON.stringify({ messages: [] }),
  })
}

async function postReadAckWithFreshLogin(): Promise<number> {
  try {
    const token = await login(TEST_USERS.alice.email, TEST_USERS.alice.password)
    const res = await postReadAck(token)
    return res.status
  } catch {
    return 0
  }
}
