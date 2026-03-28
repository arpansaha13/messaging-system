import pg from 'pg'
import { AUTH_DB_URL, MESSAGING_DB_URL } from './config'

export interface SeedUserParams {
  email: string
  username: string
  passwordHash: string
  globalName: string
}

export async function ensureTestUser(params: SeedUserParams): Promise<number> {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })

  await authClient.connect()
  await messagingClient.connect()

  try {
    const existing = await authClient.query<{ id: number | string }>('SELECT id FROM users WHERE email = $1', [params.email])
    let userId: number
    if (existing.rows.length === 0) {
      const created = await authClient.query<{ id: number | string }>(
        'INSERT INTO users (email, username, verified) VALUES ($1, $2, true) RETURNING id',
        [params.email, params.username],
      )
      userId = Number(created.rows[0].id)
      await authClient.query('INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2)', [
        userId,
        params.passwordHash,
      ])
    } else {
      userId = Number(existing.rows[0].id)
      await authClient.query('UPDATE users SET verified = true, username = $1 WHERE id = $2', [
        params.username,
        userId,
      ])
      await authClient.query(
        'INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash',
        [userId, params.passwordHash],
      )
    }

    await messagingClient.query(
      'INSERT INTO user_profiles (id, global_name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET global_name = EXCLUDED.global_name',
      [userId, params.globalName],
    )

    return userId
  } finally {
    await authClient.end()
    await messagingClient.end()
  }
}

export async function clearAuthSessions(userId: number): Promise<void> {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  await authClient.connect()
  try {
    await authClient.query('DELETE FROM sessions WHERE user_id = $1', [userId])
    await authClient.query('DELETE FROM otps WHERE user_id = $1', [userId])
  } finally {
    await authClient.end()
  }
}

export async function getLatestSessionTokenHash(userId: number): Promise<string> {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  await authClient.connect()
  try {
    const result = await authClient.query<{ token_hash: string }>(
      'SELECT token_hash FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId],
    )
    if (result.rows.length === 0) {
      throw new Error(`no sessions found for user_id=${userId}`)
    }
    return result.rows[0].token_hash
  } finally {
    await authClient.end()
  }
}
