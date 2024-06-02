import pg from 'pg'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'
import { config as dotEnvConfig } from 'dotenv'

dotEnvConfig()

const client = new pg.Client({
  user: process.env.TYPEORM_USERNAME,
  host: process.env.TYPEORM_HOST,
  database: process.env.TYPEORM_DATABASE,
  password: process.env.TYPEORM_PASSWORD,
  port: parseInt(process.env.TYPEORM_PORT ?? '5432'),
  ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false },
})

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

async function seed() {
  await client.connect()

  console.group('Clearing existing data')

  await client.query('DELETE FROM message_recipients')
  console.log('deleted message_recipients')

  await client.query('DELETE FROM messages')
  console.log('deleted message')

  await client.query('DELETE FROM contacts')
  console.log('deleted contacts')

  await client.query('DELETE FROM chats')
  console.log('deleted chats')

  await client.query('DELETE FROM users')
  console.log('deleted users')

  console.groupEnd()
  console.log()

  const chats = []

  async function insertUsers() {
    for (const user of users) {
      const result = await client.query(
        `INSERT INTO users (global_name, username, email, dp, bio, password)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        Object.values(user),
      )
      user.id = result.rows[0].id
    }
    console.log('inserted users')
  }

  async function insertChats() {
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const user1 = users[i]
        const user2 = users[j]

        // Two entries for each chat
        for (const [sender, receiver] of [
          [user1, user2],
          [user2, user1],
        ]) {
          const result = await client.query(
            `INSERT INTO chats (sender_id, receiver_id, cleared_at, muted, archived, pinned)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              sender.id,
              receiver.id,
              faker.date.past(),
              faker.datatype.boolean(),
              faker.datatype.boolean(),
              faker.datatype.boolean(),
            ],
          )
          chats.push({ id: result.rows[0].id, sender, receiver })
        }
      }
    }
    console.log('inserted chats')
  }

  async function insertMessages() {
    for (const chat of chats) {
      const messageCount = faker.number.int({ min: 1, max: 10 })
      for (let i = 0; i < messageCount; i++) {
        const sender = [chat.sender, chat.receiver][faker.number.int({ min: 0, max: 1 })]
        const receiver = sender.id === chat.sender.id ? chat.receiver : chat.sender
        const createdAt = faker.date.past()
        const updatedAt = new Date()

        const result = await client.query(
          `INSERT INTO messages (content, sender_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [faker.lorem.sentence(), sender.id, createdAt, updatedAt],
        )
        const messageId = result.rows[0].id

        await client.query(
          `INSERT INTO message_recipients (message_id, receiver_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            messageId,
            receiver.id,
            ['SENT', 'DELIVERED', 'READ'][faker.number.int({ min: 0, max: 2 })],
            createdAt,
            updatedAt,
          ],
        )
      }
    }
    console.log('inserted messages')
  }

  async function insertContacts() {
    for (const user of users) {
      const existingContacts = new Set([user.id])
      const numberOfContacts = faker.number.int({ min: 0, max: users.length - 1 })

      for (let i = 0; i < numberOfContacts; i++) {
        const possibleContacts = users.filter(u => !existingContacts.has(u.id))
        const contactUser = possibleContacts[faker.number.int({ min: 0, max: possibleContacts.length - 1 })]
        existingContacts.add(contactUser.id)

        await client.query(
          `INSERT INTO contacts
          (user_id, user_id_in_contact, alias, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)`,
          [user.id, contactUser.id, faker.person.fullName(), faker.date.past(), faker.date.past()],
        )
      }
    }
    console.log('inserted contacts')
  }

  await insertUsers()
  await insertChats()
  await insertMessages()
  await insertContacts()

  await client.end()
}

seed().catch(e => console.error(e.stack))
