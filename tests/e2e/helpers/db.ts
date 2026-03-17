import pg from 'pg'
import { TEST_USERS, type TestUserKey } from '../fixtures/users'

const AUTH_DB_URL = 'postgresql://testuser:testpass@localhost:7511/auth_e2e_db'
const MESSAGING_DB_URL = 'postgresql://testuser:testpass@localhost:7521/messaging_e2e_db'

export interface SeedUserParams {
  email: string
  username: string
  passwordHash: string
  globalName: string
}

/**
 * Seeds a single test user directly into both databases.
 *
 * auth DB:      users (email, username, verified=true) + credentials (password_hash)
 * messaging DB: user_profiles (id, global_name)
 *
 * Mirrors the pattern in scripts/seed/src/users.mjs.
 * Returns the auth user ID, which is also the user_profiles FK.
 */
export async function seedTestUser(params: SeedUserParams): Promise<number> {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })

  await authClient.connect()
  await messagingClient.connect()

  try {
    const userResult = await authClient.query<{ id: number }>(
      'INSERT INTO users (email, username, verified) VALUES ($1, $2, true) RETURNING id',
      [params.email, params.username],
    )
    const userId = userResult.rows[0].id

    await authClient.query('INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2)', [
      userId,
      params.passwordHash,
    ])

    await messagingClient.query('INSERT INTO user_profiles (id, global_name) VALUES ($1, $2)', [
      userId,
      params.globalName,
    ])

    return userId
  } finally {
    await authClient.end()
    await messagingClient.end()
  }
}

/**
 * Returns true if a user with the given email already exists in the auth DB.
 * Used by global-setup to make seeding idempotent across partial runs.
 */
export async function userExists(email: string): Promise<boolean> {
  const client = new pg.Client({ connectionString: AUTH_DB_URL })
  await client.connect()
  try {
    const result = await client.query('SELECT 1 FROM users WHERE email = $1', [email])
    return result.rows.length > 0
  } finally {
    await client.end()
  }
}

/**
 * Deletes a user by email from auth DB and corresponding profile from messaging DB.
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })

  await authClient.connect()
  await messagingClient.connect()

  try {
    const result = await authClient.query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return
    }
    const userId = result.rows[0].id

    await authClient.query('DELETE FROM users WHERE id = $1', [userId])
    await messagingClient.query('DELETE FROM user_profiles WHERE id = $1', [userId])
  } finally {
    await authClient.end()
    await messagingClient.end()
  }
}

/**
 * Clears contacts to keep E2E runs isolated.
 */
export async function clearContacts(): Promise<void> {
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })
  await messagingClient.connect()
  try {
    await messagingClient.query('DELETE FROM contacts')
  } finally {
    await messagingClient.end()
  }
}

/**
 * Clears messages and related recipients to keep E2E runs isolated.
 */
export async function clearMessages(): Promise<void> {
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })
  await messagingClient.connect()
  try {
    await messagingClient.query('DELETE FROM message_recipients')
    await messagingClient.query('DELETE FROM messages')
  } finally {
    await messagingClient.end()
  }
}

/**
 * Clears chats to avoid stale state between runs.
 */
export async function clearChats(): Promise<void> {
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })
  await messagingClient.connect()
  try {
    await messagingClient.query('DELETE FROM chats')
  } finally {
    await messagingClient.end()
  }
}

/**
 * Clears group-related data (invites/user_groups/channels/groups).
 * Invites are cleared separately because some may have NULL group_id.
 */
export async function clearInvites(): Promise<void> {
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })
  await messagingClient.connect()
  try {
    await messagingClient.query('DELETE FROM invites')
  } finally {
    await messagingClient.end()
  }
}

export async function clearGroups(): Promise<void> {
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })
  await messagingClient.connect()
  try {
    await messagingClient.query('DELETE FROM user_groups')
    await messagingClient.query('DELETE FROM channels')
    await messagingClient.query('DELETE FROM groups')
  } finally {
    await messagingClient.end()
  }
}

/**
 * Resets test user profiles to seeded values.
 */
export async function resetProfiles(userIds: Record<TestUserKey, number>): Promise<void> {
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })
  await messagingClient.connect()
  try {
    for (const [key, user] of Object.entries(TEST_USERS) as [TestUserKey, (typeof TEST_USERS)[TestUserKey]][]) {
      const userId = userIds[key]
      if (!userId) continue
      await messagingClient.query(
        'UPDATE user_profiles SET global_name = $1, bio = $2, dp = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [user.globalName, 'Hey there!', userId],
      )
    }
  } finally {
    await messagingClient.end()
  }
}

/**
 * Clears auth sessions and OTPs for the seeded test users.
 */
export async function clearAuthSessionsAndOtps(userIds: Record<TestUserKey, number>): Promise<void> {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  await authClient.connect()
  try {
    const ids = Object.values(userIds).filter(Boolean)
    if (ids.length === 0) return
    await authClient.query('DELETE FROM sessions WHERE user_id = ANY($1)', [ids])
    await authClient.query('DELETE FROM otps WHERE user_id = ANY($1)', [ids])
  } finally {
    await authClient.end()
  }
}
