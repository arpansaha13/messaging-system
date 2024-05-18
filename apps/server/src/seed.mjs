import pg from 'pg'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'
import { config as dotEnvConfig } from 'dotenv'

dotEnvConfig()

const pool = new pg.Pool({
  user: process.env.TYPEORM_USERNAME,
  host: process.env.TYPEORM_HOST,
  database: process.env.TYPEORM_DATABASE,
  password: process.env.TYPEORM_PASSWORD,
  port: parseInt(process.env.TYPEORM_PORT ?? '5432'),
})

async function executeQuery(query, params) {
  const client = await pool.connect()
  try {
    const res = await client.query(query, params)
    return res.rows
  } catch (error) {
    console.error('Error executing query:', error)
  } finally {
    client.release()
  }
}

async function insertUsers() {
  const hashedPwd = await bcrypt.hash('@Password0', await bcrypt.genSalt())

  const users = [
    {
      global_name: 'Aarav Sharma',
      username: 'aarav',
      email: 'aarav@test.com',
      bio: 'Hey there! I am using WhatsApp.',
      password: hashedPwd,
    },
    {
      global_name: 'Aditi Verma',
      username: 'aditi',
      email: 'aditi@test.com',
      bio: 'Hey there! I am using WhatsApp.',
      password: hashedPwd,
    },
    {
      global_name: 'Raj Patel',
      username: 'raj',
      email: 'raj@test.com',
      bio: 'Hey there! I am using WhatsApp.',
      password: hashedPwd,
    },
    {
      global_name: 'Neha Gupta',
      username: 'neha',
      email: 'neha@test.com',
      bio: 'Hey there! I am using WhatsApp.',
      password: hashedPwd,
    },
    {
      global_name: 'Rohan Kumar',
      username: 'rohan',
      email: 'rohan@test.com',
      bio: 'Hey there! I am using WhatsApp.',
      password: hashedPwd,
    },
  ]

  const insertQuery = `
    INSERT INTO users (global_name, username, email, bio, password)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `

  for (const user of users) {
    const params = [user.global_name, user.username, user.email, user.bio, user.password]
    await executeQuery(insertQuery, params)
  }

  console.log('Users inserted successfully.')
}

async function insertContacts() {
  const users = await executeQuery('SELECT id FROM users ORDER BY id')
  const contactInsertQuery = `
    INSERT INTO contacts (user_id, user_id_in_contact, alias, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5)
  `

  const now = new Date()

  for (const user of users) {
    // Each user can have 1 to (total_users - 1) contacts
    const numContacts = Math.floor(Math.random() * (users.length - 1)) + 1

    for (let i = 0; i < numContacts; i++) {
      const contactId = users[Math.floor(Math.random() * users.length)].id

      if (contactId !== user.id) {
        const alias = faker.person.fullName()
        await executeQuery(contactInsertQuery, [user.id, contactId, alias, now, now])
        console.log(`Inserted contact for user ${user.id} with contact ${contactId}`)
      }
    }
  }
}

async function insertRoomsAndUserToRoom() {
  const users = await executeQuery('SELECT id FROM users ORDER BY id')

  const roomInsertQuery = `
    INSERT INTO rooms (created_at)
    VALUES ($1)
    RETURNING id
  `

  const userToRoomInsertQuery = `
    INSERT INTO user_to_room (user_id, room_id, first_msg_tstamp, is_muted, archived, pinned, deleted)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `

  const now = new Date(2023, 0, 1)
  for (let i = 0; i < users.length - 1; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const room = await executeQuery(roomInsertQuery, [now])
      const roomId = room[0].id

      await executeQuery(userToRoomInsertQuery, [users[i].id, roomId, now, false, false, false, false])
      await executeQuery(userToRoomInsertQuery, [users[j].id, roomId, now, false, false, false, false])

      console.log(`Room ${roomId} created for user ${users[i].id} and user ${users[j].id}`)
    }
  }
}

async function insertMessages() {
  const rooms = await executeQuery('SELECT id FROM rooms')

  const messageInsertQuery = `
    INSERT INTO messages (room_id, content, status, sender_id, deleted_by, deleted_for_everyone, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `

  for (const room of rooms) {
    const roomId = room.id
    const roomUsers = await executeQuery('SELECT user_id FROM user_to_room WHERE room_id = $1', [roomId])

    for (let i = 0; i < 50; i++) {
      // Adjust number of messages as needed
      const content = faker.lorem.sentence()
      const status = 'SENT'
      const senderId = roomUsers[Math.floor(Math.random() * roomUsers.length)].user_id
      const createdAt = faker.date.recent({ days: 30 }) // Recent 30 days
      const deletedBy = {}
      const deletedForEveryone = false

      await executeQuery(messageInsertQuery, [
        roomId,
        content,
        status,
        senderId,
        JSON.stringify(deletedBy),
        deletedForEveryone,
        createdAt,
      ])
    }

    console.log(`Inserted messages for room ${roomId}`)
  }
}

async function main() {
  await insertUsers()
  await insertContacts()
  await insertRoomsAndUserToRoom()
  await insertMessages()
  await pool.end()
}

main().catch(console.error)
