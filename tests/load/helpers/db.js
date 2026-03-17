import pg from 'pg'
import bcrypt from 'bcryptjs'

const AUTH_DB_URL = 'postgresql://testuser:testpass@localhost:7511/auth_load_db'
const MESSAGING_DB_URL = 'postgresql://testuser:testpass@localhost:7521/messaging_load_db'

export async function seedUsers(users) {
  const results = []

  for (const user of users) {
    const result = await seedUser(user)
    results.push(result)
  }

  return results
}

export async function cleanupUsers(emails) {
  for (const email of emails) {
    await deleteUserByEmail(email)
  }
}

async function seedUser({ email, password, globalName }) {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })

  await authClient.connect()
  await messagingClient.connect()

  try {
    await deleteUserByEmail(email)

    const passwordHash = await bcrypt.hash(password, 10)
    const username = email.split('@')[0]

    const userResult = await authClient.query(
      'INSERT INTO users (email, username, verified) VALUES ($1, $2, true) RETURNING id',
      [email, username],
    )
    const userId = userResult.rows[0].id

    await authClient.query('INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2)', [
      userId,
      passwordHash,
    ])
    await messagingClient.query('INSERT INTO user_profiles (id, global_name) VALUES ($1, $2)', [
      userId,
      globalName,
    ])

    return { email, id: userId }
  } finally {
    await authClient.end()
    await messagingClient.end()
  }
}

async function deleteUserByEmail(email) {
  const authClient = new pg.Client({ connectionString: AUTH_DB_URL })
  const messagingClient = new pg.Client({ connectionString: MESSAGING_DB_URL })

  await authClient.connect()
  await messagingClient.connect()

  try {
    const result = await authClient.query('SELECT id FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return
    }

    const userId = result.rows[0].id
    await authClient.query('DELETE FROM sessions WHERE user_id = $1', [userId])
    await authClient.query('DELETE FROM otps WHERE user_id = $1', [userId])
    await authClient.query('DELETE FROM credentials WHERE user_id = $1', [userId])
    await authClient.query('DELETE FROM users WHERE id = $1', [userId])
    await messagingClient.query('DELETE FROM user_profiles WHERE id = $1', [userId])
  } finally {
    await authClient.end()
    await messagingClient.end()
  }
}
