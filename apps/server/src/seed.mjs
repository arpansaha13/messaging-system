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
})

const hashedPwd = await bcrypt.hash('@Password0', await bcrypt.genSalt())

const users = [
  {
    global_name: 'Aarav Sharma',
    username: 'aarav',
    email: 'aarav@test.com',
    dp: null,
    bio: 'Hey there! I am using WhatsApp.',
    password: hashedPwd,
  },
  {
    global_name: 'Aditi Verma',
    username: 'aditi',
    email: 'aditi@test.com',
    dp: null,
    bio: 'Hey there! I am using WhatsApp.',
    password: hashedPwd,
  },
  {
    global_name: 'Raj Patel',
    username: 'raj',
    email: 'raj@test.com',
    dp: null,
    bio: 'Hey there! I am using WhatsApp.',
    password: hashedPwd,
  },
  {
    global_name: 'Neha Gupta',
    username: 'neha',
    email: 'neha@test.com',
    dp: null,
    bio: 'Hey there! I am using WhatsApp.',
    password: hashedPwd,
  },
  {
    global_name: 'Rohan Kumar',
    username: 'rohan',
    email: 'rohan@test.com',
    dp: null,
    bio: 'Hey there! I am using WhatsApp.',
    password: hashedPwd,
  },
]

async function seed() {
  await client.connect()

  // Clear existing data
  await client.query('DELETE FROM message_recipients')
  await client.query('DELETE FROM messages')
  await client.query('DELETE FROM contacts')
  await client.query('DELETE FROM chats')
  await client.query('DELETE FROM users')

  const chats = []

  async function insertUsers() {
    for (let i = 0; i < 5; i++) {
      const result = await client.query(
        `INSERT INTO users (global_name, username, email, dp, bio, password)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        Object.values(users[i]),
      )
      users[i].id = result.rows[0].id
    }
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
            `INSERT INTO chats (sender_id, receiver_id, first_msg_tstamp, muted, archived, pinned)
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
  }

  async function insertMessages() {
    for (const chat of chats) {
      const messageCount = faker.number.int({ min: 1, max: 10 })
      for (let i = 0; i < messageCount; i++) {
        const sender = [chat.sender, chat.receiver][faker.number.int({ min: 0, max: 1 })]
        const receiver = sender.id === chat.sender.id ? chat.receiver : chat.sender

        const result = await client.query(
          `INSERT INTO messages (content, sender_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [faker.lorem.sentence(), sender.id, faker.date.past(), new Date()],
        )
        const messageId = result.rows[0].id

        await client.query(
          `INSERT INTO message_recipients (message_id, receiver_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            messageId,
            receiver.id,
            ['SENT', 'DELIVERED', 'READ'][faker.number.int({ min: 0, max: 2 })],
            new Date(),
            new Date(),
          ],
        )
      }
    }
  }

  async function insertContacts() {
    for (const user of users) {
      const numberOfContacts = faker.number.int({ min: 1, max: users.length - 1 })
      for (let i = 0; i < numberOfContacts; i++) {
        const contactUser = users.filter(u => u.id !== user.id)[faker.number.int({ min: 0, max: users.length - 2 })]
        await client.query(
          `INSERT INTO contacts (user_id, user_id_in_contact, alias, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, contactUser.id, faker.person.fullName(), new Date(), new Date()],
        )
      }
    }
  }

  await insertUsers()
  await insertChats()
  await insertMessages()
  await insertContacts()
  await client.end()
}

seed().catch(e => console.error(e.stack))
