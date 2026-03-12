import pg from 'pg'

const AUTH_DB_URL = 'postgresql://testuser:testpass@localhost:7511/auth_test_db'
const MESSAGING_DB_URL = 'postgresql://testuser:testpass@localhost:7521/messaging_test_db'

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
