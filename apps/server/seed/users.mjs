import bcrypt from 'bcryptjs'

const hashedPwd = await bcrypt.hash('@Password0', await bcrypt.genSalt())

const users = [
  {
    global_name: 'Aarav Sharma',
    username: 'aarav',
    email: 'aarav@test.com',
    dp: null,
    bio: 'Love exploring new technologies!',
    password: hashedPwd,
  },
  {
    global_name: 'Aditi Verma',
    username: 'aditi',
    email: 'aditi@test.com',
    dp: null,
    bio: 'Travel enthusiast and foodie.',
    password: hashedPwd,
  },
  {
    global_name: 'Raj Patel',
    username: 'raj',
    email: 'raj@test.com',
    dp: null,
    bio: 'Passionate about photography.',
    password: hashedPwd,
  },
  {
    global_name: 'Neha Gupta',
    username: 'neha',
    email: 'neha@test.com',
    dp: null,
    bio: 'Bookworm and aspiring writer.',
    password: hashedPwd,
  },
  {
    global_name: 'Rohan Kumar',
    username: 'rohan',
    email: 'rohan@test.com',
    dp: null,
    bio: 'Fitness freak and music lover.',
    password: hashedPwd,
  },
  {
    global_name: 'Priya Singh',
    username: 'priya',
    email: 'priya@test.com',
    dp: null,
    bio: 'Living life one day at a time.',
    password: hashedPwd,
  },
  {
    global_name: 'Kabir Joshi',
    username: 'kabir',
    email: 'kabir@test.com',
    dp: null,
    bio: 'Adventure awaits!',
    password: hashedPwd,
  },
  {
    global_name: 'Ananya Rao',
    username: 'ananya',
    email: 'ananya@test.com',
    dp: null,
    bio: 'Coffee lover ☕',
    password: hashedPwd,
  },
  {
    global_name: 'Ishaan Mehta',
    username: 'ishaan',
    email: 'ishaan@test.com',
    dp: null,
    bio: 'Tech enthusiast and coder.',
    password: hashedPwd,
  },
  {
    global_name: 'Tanya Kapoor',
    username: 'tanya',
    email: 'tanya@test.com',
    dp: null,
    bio: 'Dream big, work hard!',
    password: hashedPwd,
  },
  {
    global_name: 'Arjun Malhotra',
    username: 'arjun',
    email: 'arjun@test.com',
    dp: null,
    bio: 'Life is a journey.',
    password: hashedPwd,
  },
  {
    global_name: 'Sana Khan',
    username: 'sana',
    email: 'sana@test.com',
    dp: null,
    bio: 'Smile and the world smiles with you.',
    password: hashedPwd,
  },
]

export async function insertUsers(client) {
  const values = []
  const placeholders = users
    .map((user, i) => {
      const index = i * 6
      values.push(...Object.values(user))
      return `($${index + 1}, $${index + 2}, $${index + 3}, $${index + 4}, $${index + 5}, $${index + 6})`
    })
    .join(', ')

  const query = `
    INSERT INTO users (global_name, username, email, dp, bio, password)
    VALUES ${placeholders}
    RETURNING id
  `

  const result = await client.query(query, values) // bulk insert users

  result.rows.forEach((row, i) => {
    users[i].id = row.id
  })

  return {
    data: users,
    count: result.rows.length,
  }
}
