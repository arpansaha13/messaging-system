import WebSocket from 'ws'
import bcrypt from 'bcryptjs'
import { TEST_USERS } from '../fixtures/users'
import { login } from '../helpers/auth'
import { stopService, startService, waitServiceHealthy } from '../helpers/compose'
import { backendFetch } from '../helpers/http'
import { ensureTestUser } from '../helpers/db'
import { poll, sleep } from '../helpers/poll'
import { closeSocket, connectWebSocket, sendEvent, waitForEvent } from '../helpers/ws'

describe.sequential('socket resilience', () => {
  let aliceId = 0
  let bobId = 0
  let aliceSession = ''
  let bobSession = ''

  beforeAll(async () => {
    startService('backend')
    await waitServiceHealthy('auth_test')
    await waitServiceHealthy('rabbitmq_test')
    await waitServiceHealthy('memcached_test')
    await waitServiceHealthy('socket_test')
    await waitForBackendLivez()

    const alice = TEST_USERS.alice
    const bob = TEST_USERS.bob
    const aliceHash = await bcrypt.hash(alice.password, 10)
    const bobHash = await bcrypt.hash(bob.password, 10)

    aliceId = await ensureTestUser({
      email: alice.email,
      username: 'alice',
      passwordHash: aliceHash,
      globalName: alice.globalName,
    })
    bobId = await ensureTestUser({
      email: bob.email,
      username: 'bob',
      passwordHash: bobHash,
      globalName: bob.globalName,
    })

    aliceSession = await waitForBackendLogin(TEST_USERS.alice.email, TEST_USERS.alice.password)
    bobSession = await waitForBackendLogin(TEST_USERS.bob.email, TEST_USERS.bob.password)
  })

  afterAll(async () => {
    startService('backend')
    startService('auth')
    startService('rabbitmq')
    startService('memcached')
    await waitServiceHealthy('auth_test')
    await waitServiceHealthy('rabbitmq_test')
    await waitServiceHealthy('memcached_test')
    await waitForBackendLivez()
  })

  beforeEach(async () => {
    startService('backend')
    startService('auth')
    startService('rabbitmq')
    startService('memcached')
    await waitServiceHealthy('auth_test')
    await waitServiceHealthy('rabbitmq_test')
    await waitServiceHealthy('memcached_test')
    await waitForBackendLivez()
    aliceSession = await waitForBackendLogin(TEST_USERS.alice.email, TEST_USERS.alice.password)
    bobSession = await waitForBackendLogin(TEST_USERS.bob.email, TEST_USERS.bob.password)
  })

  it('auth outage blocks new websocket connections then heals', async () => {
    const healthy = await connectWebSocket(aliceSession)
    await closeSocket(healthy)

    stopService('auth')
    await poll(
      async () => {
        try {
          const ws = await connectWebSocket(aliceSession)
          await closeSocket(ws)
          return false
        } catch {
          return true
        }
      },
      (failed) => failed,
      { timeoutMs: 25_000, intervalMs: 1_000, description: 'auth websocket outage' },
    )

    startService('auth')
    await waitServiceHealthy('auth_test')

    await poll(
      async () => {
        try {
          const ws = await connectWebSocket(aliceSession)
          await closeSocket(ws)
          return true
        } catch {
          return false
        }
      },
      (ok) => ok,
      { description: 'auth websocket recovery' },
    )
  })

  it('rabbitmq outage drops typing events then heals', async () => {
    let aliceWs = await connectWebSocket(aliceSession)
    let bobWs = await connectWebSocket(bobSession)

    try {
      await poll(
        async () => {
          sendEvent(aliceWs, 'personal:typing', { senderId: aliceId, receiverId: bobId, isTyping: true })
          try {
            const evt = await waitForEvent<{ senderId: number }>(bobWs, 'personal:typing', 3_000)
            return evt.data.senderId === aliceId
          } catch {
            return false
          }
        },
        (ok) => ok,
        { timeoutMs: 20_000, intervalMs: 500, description: 'typing baseline delivery' },
      )

      stopService('rabbitmq')
      await sleep(2_000)
      await poll(
        async () => {
          sendEvent(aliceWs, 'personal:typing', { senderId: aliceId, receiverId: bobId, isTyping: false })
          try {
            await waitForEvent(bobWs, 'personal:typing', 2_000)
            return false
          } catch {
            return true
          }
        },
        (blocked) => blocked,
        { timeoutMs: 20_000, intervalMs: 500, description: 'typing outage non-delivery' },
      )

      startService('rabbitmq')
      await waitServiceHealthy('rabbitmq_test')
      await closeSocket(aliceWs)
      await closeSocket(bobWs)
      aliceWs = await connectWebSocket(aliceSession)
      bobWs = await connectWebSocket(bobSession)

      await poll(
        async () => {
          sendEvent(aliceWs, 'personal:typing', { senderId: aliceId, receiverId: bobId, isTyping: true })
          try {
            await waitForEvent(bobWs, 'personal:typing', 5_000)
            return true
          } catch {
            return false
          }
        },
        (ok) => ok,
        { timeoutMs: 120_000, intervalMs: 1_000, description: 'typing delivery recovery' },
      )
    } finally {
      await closeSocket(aliceWs)
      await closeSocket(bobWs)
    }
  })

  it('memcached outage degrades online status then heals', async () => {
    let aliceWs = await connectWebSocket(aliceSession)
    let bobWs = await connectWebSocket(bobSession)

    try {
      await poll(
        async () => {
          aliceWs = await ensureSocketOpen(aliceWs, aliceSession)
          bobWs = await ensureSocketOpen(bobWs, bobSession)
          await touchPresence(bobWs)
          const statuses = await checkOnline(aliceWs, [bobId])
          return statuses[bobId] === true
        },
        (ok) => ok,
        { timeoutMs: 90_000, intervalMs: 1_000, description: 'online status baseline' },
      )

      stopService('memcached')
      aliceWs = await ensureSocketOpen(aliceWs, aliceSession)
      bobWs = await ensureSocketOpen(bobWs, bobSession)
      const degraded = await checkOnline(aliceWs, [bobId])
      expect(degraded[bobId]).toBe(false)

      startService('memcached')
      await waitServiceHealthy('memcached_test')

      await poll(
        async () => {
          aliceWs = await ensureSocketOpen(aliceWs, aliceSession)
          bobWs = await ensureSocketOpen(bobWs, bobSession)
          await touchPresence(bobWs)
          const statuses = await checkOnline(aliceWs, [bobId])
          return statuses[bobId] === true
        },
        (ok) => ok,
        { timeoutMs: 120_000, intervalMs: 1_000, description: 'memcached recovery' },
      )
    } finally {
      await closeSocket(aliceWs)
      await closeSocket(bobWs)
    }
  })
})

async function checkOnline(
  ws: WebSocket,
  userIds: number[],
): Promise<Record<number, boolean>> {
  sendEvent(ws, 'personal:check-online', { userIds })
  const response = await waitForEvent<{ statuses: Record<string, boolean> }>(ws, 'personal:check-online-response')
  const normalized: Record<number, boolean> = {}
  for (const [key, value] of Object.entries(response.data.statuses ?? {})) {
    normalized[Number(key)] = value
  }
  return normalized
}

async function touchPresence(ws: WebSocket): Promise<void> {
  if (ws.readyState !== WebSocket.OPEN) return
  await new Promise<void>((resolve, reject) => {
    ws.pong(undefined, true, (err?: Error) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

async function ensureSocketOpen(ws: WebSocket, sessionToken: string): Promise<WebSocket> {
  if (ws.readyState === WebSocket.OPEN) {
    return ws
  }
  if (ws.readyState === WebSocket.CONNECTING) {
    await poll(
      () => ws.readyState,
      (state) => state === WebSocket.OPEN,
      { timeoutMs: 5_000, intervalMs: 200, description: 'websocket open state' },
    )
    return ws
  }
  try {
    await closeSocket(ws)
  } catch {
    // Ignore close errors for already closed sockets.
  }
  return connectWebSocket(sessionToken)
}

async function waitForBackendLivez(timeoutMs = 45_000): Promise<void> {
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
    { timeoutMs, intervalMs: 1_000, description: 'backend livez for socket tests' },
  )
}

async function waitForBackendLogin(email: string, password: string): Promise<string> {
  return poll(
    async () => {
      try {
        return await login(email, password)
      } catch {
        return ''
      }
    },
    (token) => token.length > 0,
    { timeoutMs: 60_000, intervalMs: 1_000, description: `backend login ${email}` },
  )
}
