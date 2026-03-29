import path from 'node:path'
import fs from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import * as api from './helpers/api'
import { clearChats, clearContacts, clearGroups, clearInvites, clearMessages, seedTestUser, userExists } from './helpers/db'
import { getDirname } from './helpers/dirname'
import { TEST_USERS, type TestUserKey } from './fixtures/users'

const __dirname = getDirname(import.meta.url)

const AUTH_DIR = path.join(__dirname, '.auth')
const BACKEND_URL = 'http://localhost:7530'

export default async function globalSetup() {
  await fs.mkdir(AUTH_DIR, { recursive: true })

  await waitForBackend()
  await clearMessages()
  await clearChats()
  await clearContacts()
  await clearInvites()
  await clearGroups()
  console.log('[global-setup] Cleared messages, chats, contacts, invites, groups')

  const userIds: Record<string, number> = {}

  for (const [key, user] of Object.entries(TEST_USERS) as [TestUserKey, (typeof TEST_USERS)[TestUserKey]][]) {
    // Seed directly into DBs
    // OTPs are stored hashed so they cannot be retrieved; direct insertion is the only viable approach.
    const exists = await userExists(user.email)
    if (!exists) {
      const passwordHash = await bcrypt.hash(user.password, 10)
      const username = user.email.split('@')[0]
      await seedTestUser({ email: user.email, username, passwordHash, globalName: user.globalName })
      console.log(`[global-setup] Seeded ${user.email}`)
    } else {
      console.log(`[global-setup] ${user.email} already exists, skipping seed`)
    }

    // Login via the real auth API to obtain a valid session token.
    // Cannot be seeded directly — the token hash requires the service's SECRET_KEY.
    const sessionToken = await api.login(user.email, user.password)

    const me = await api.getMe(sessionToken)
    userIds[key] = me.id

    console.log(`[global-setup] ${user.email} ready (id=${me.id})`)
  }

  await fs.writeFile(path.join(AUTH_DIR, 'user-ids.json'), JSON.stringify(userIds, null, 2))
  console.log('[global-setup] All users ready:', userIds)
}

async function waitForBackend(maxAttempts = 30, intervalMs = 2000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'probe@probe.local', password: 'probe' }),
      })
      // Any HTTP response (even 4xx) means the server is up
      if (res.status < 500) return
    } catch {
      // Connection refused — server not up yet
    }
    console.log(`[global-setup] Waiting for backend... (${i + 1}/${maxAttempts})`)
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  throw new Error('Backend did not become ready in time')
}
