import bcrypt from 'bcryptjs'

const hashedPwd = await bcrypt.hash('@Password0', await bcrypt.genSalt())

const users = [
  {
    global_name: 'Aarav Sharma',
    email: 'aarav@test.com',
    dp: null,
    bio: 'Love exploring new technologies!',
    password: hashedPwd,
  },
  {
    global_name: 'Aditi Verma',
    email: 'aditi@test.com',
    dp: null,
    bio: 'Travel enthusiast and foodie.',
    password: hashedPwd,
  },
  {
    global_name: 'Raj Patel',
    email: 'raj@test.com',
    dp: null,
    bio: 'Passionate about photography.',
    password: hashedPwd,
  },
  {
    global_name: 'Neha Gupta',
    email: 'neha@test.com',
    dp: null,
    bio: 'Bookworm and aspiring writer.',
    password: hashedPwd,
  },
  {
    global_name: 'Rohan Kumar',
    email: 'rohan@test.com',
    dp: null,
    bio: 'Fitness freak and music lover.',
    password: hashedPwd,
  },
  {
    global_name: 'Priya Singh',
    email: 'priya@test.com',
    dp: null,
    bio: 'Living life one day at a time.',
    password: hashedPwd,
  },
  {
    global_name: 'Kabir Joshi',
    email: 'kabir@test.com',
    dp: null,
    bio: 'Adventure awaits!',
    password: hashedPwd,
  },
  {
    global_name: 'Ananya Rao',
    email: 'ananya@test.com',
    dp: null,
    bio: 'Coffee lover ☕',
    password: hashedPwd,
  },
  {
    global_name: 'Ishaan Mehta',
    email: 'ishaan@test.com',
    dp: null,
    bio: 'Tech enthusiast and coder.',
    password: hashedPwd,
  },
  {
    global_name: 'Tanya Kapoor',
    email: 'tanya@test.com',
    dp: null,
    bio: 'Dream big, work hard!',
    password: hashedPwd,
  },
  {
    global_name: 'Arjun Malhotra',
    email: 'arjun@test.com',
    dp: null,
    bio: 'Life is a journey.',
    password: hashedPwd,
  },
  {
    global_name: 'Sana Khan',
    email: 'sana@test.com',
    dp: null,
    bio: 'Smile and the world smiles with you.',
    password: hashedPwd,
  },
]

export async function insertUsers(messagingClient, authClient) {
  // Insert into auth service: only email and username (from email prefix)
  const authValues = []
  const authPlaceholders = users
    .map((user, i) => {
      const index = i * 3
      const username = user.email.split('@')[0] // Generate username from email prefix
      authValues.push(user.email, username, true)
      return `($${index + 1}, $${index + 2}, $${index + 3})`
    })
    .join(', ')

  const authQuery = `
    INSERT INTO users (email, username, verified)
    VALUES ${authPlaceholders}
    RETURNING id
  `

  const authResult = await authClient.query(authQuery, authValues)

  // Insert credentials for each user
  const credentialValues = []
  const credentialPlaceholders = users
    .map((user, i) => {
      const index = i * 2
      credentialValues.push(authResult.rows[i].id, user.password)
      return `($${index + 1}, $${index + 2})`
    })
    .join(', ')

  const credentialsQuery = `
    INSERT INTO credentials (user_id, password_hash)
    VALUES ${credentialPlaceholders}
  `

  await authClient.query(credentialsQuery, credentialValues)

  // Insert into messaging-system: user_id (FK), global_name, dp, bio
  const messagingValues = []
  const messagingPlaceholders = users
    .map((user, i) => {
      const index = i * 4
      messagingValues.push(authResult.rows[i].id, user.global_name, user.dp, user.bio)
      return `($${index + 1}, $${index + 2}, $${index + 3}, $${index + 4})`
    })
    .join(', ')

  const messagingQuery = `
    INSERT INTO user_profiles (id, global_name, dp, bio)
    VALUES ${messagingPlaceholders}
    RETURNING id
  `

  await messagingClient.query(messagingQuery, messagingValues)

  // Combine results for other seeds that need user data
  const combinedUsers = users.map((user, i) => ({
    ...user,
    id: authResult.rows[i].id,
  }))

  return {
    data: combinedUsers,
    count: authResult.rows.length,
  }
}
