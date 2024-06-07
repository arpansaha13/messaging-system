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

const chats = []

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

  async function insertUsers() {
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

    return result.rows.length
  }

  async function insertChats() {
    const chatEntries = []
    let chatsInsertCount = 0

    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (i === j) continue

        // 60% chance of this chat to exist
        if (faker.number.int({ min: 0, max: 10 }) < 4) continue

        const user1 = users[i]
        const user2 = users[j]

        // Two entries for each chat
        for (const [sender, receiver] of [
          [user1, user2],
          [user2, user1],
        ]) {
          chatEntries.push({
            sender_id: sender.id,
            receiver_id: receiver.id,
            cleared_at: faker.date.past(),
            muted: faker.datatype.boolean(),
            archived: faker.datatype.boolean(),
            pinned: faker.datatype.boolean(),
          })

          // 20 at a time
          if (chatEntries.length === 20) {
            await bulkInsertChats(chatEntries)
            chatsInsertCount += chatEntries.length
            chatEntries.length = 0 // Clear the array
          }
        }
      }
    }

    // Insert remaining chat entries
    if (chatEntries.length > 0) {
      await bulkInsertChats(chatEntries)
      chatsInsertCount += chatEntries.length
    }

    return chatsInsertCount

    async function bulkInsertChats(entries) {
      const values = []
      const placeholders = entries
        .map((entry, i) => {
          const offset = i * 6
          values.push(entry.sender_id, entry.receiver_id, entry.cleared_at, entry.muted, entry.archived, entry.pinned)
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
        })
        .join(', ')

      const query = `
        INSERT INTO chats (sender_id, receiver_id, cleared_at, muted, archived, pinned)
        VALUES ${placeholders}
        RETURNING id
      `

      const result = await client.query(query, values)
      result.rows.forEach((row, i) => {
        chats.push({ id: row.id, sender_id: entries[i].sender_id, receiver_id: entries[i].receiver_id })
      })
    }
  }

  async function insertMessages() {
    const messageEntries = []
    const messageRecipientEntries = []
    let messagesInsertCount = 0
    let recipientsInsertCount = 0

    for (const chat of chats) {
      const messageCount = faker.number.int({ min: 0, max: 100 })

      for (let i = 0; i < messageCount; i++) {
        const sender_id = faker.helpers.arrayElement([chat.sender_id, chat.receiver_id])
        const receiver_id = sender_id === chat.sender_id ? chat.receiver_id : chat.sender_id
        const createdAt = faker.date.past()
        const updatedAt = faker.date.between({ from: createdAt, to: new Date() })

        const message = {
          content: faker.lorem.sentence(),
          sender_id: sender_id,
          created_at: createdAt,
          updated_at: updatedAt,
        }
        messageEntries.push(message)

        const recipient = {
          receiver_id: receiver_id,
          status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'READ']),
          created_at: createdAt,
          updated_at: updatedAt,
        }
        messageRecipientEntries.push(recipient)

        if (messageEntries.length === 20) {
          await bulkInsertMessagesAndRecipients(messageEntries, messageRecipientEntries)
          messagesInsertCount += messageEntries.length
          recipientsInsertCount += messageRecipientEntries.length
          messageEntries.length = 0 // Clear the array
          messageRecipientEntries.length = 0 // Clear the array
        }
      }
    }

    // Insert remaining messages and recipients
    if (messageEntries.length > 0) {
      await bulkInsertMessagesAndRecipients(messageEntries, messageRecipientEntries)
      messagesInsertCount += messageEntries.length
      recipientsInsertCount += messageRecipientEntries.length
    }

    return { messagesInsertCount, recipientsInsertCount }

    async function bulkInsertMessagesAndRecipients(messages, recipients) {
      const messageValues = []
      const messagePlaceholders = messages
        .map((message, index) => {
          const offset = index * 4
          messageValues.push(message.content, message.sender_id, message.created_at, message.updated_at)
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
        })
        .join(', ')

      const messageQuery = `
        INSERT INTO messages (content, sender_id, created_at, updated_at)
        VALUES ${messagePlaceholders}
        RETURNING id
      `

      const messageResult = await client.query(messageQuery, messageValues)
      const messageIds = messageResult.rows.map(row => row.id)

      const recipientValues = []
      const recipientPlaceholders = recipients
        .map((recipient, i) => {
          const offset = i * 5
          recipientValues.push(
            messageIds[i],
            recipient.receiver_id,
            recipient.status,
            recipient.created_at,
            recipient.updated_at,
          )
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
        })
        .join(', ')

      const recipientQuery = `
        INSERT INTO message_recipients (message_id, receiver_id, status, created_at, updated_at)
        VALUES ${recipientPlaceholders}
      `

      await client.query(recipientQuery, recipientValues)
    }
  }

  async function insertContacts() {
    const contactEntries = []
    const maxContacts = 50
    let contactsInsertCount = 0

    for (const user of users) {
      const existingContacts = new Set([user.id])
      const numberOfContacts = faker.number.int({ min: 0, max: Math.min(maxContacts, users.length - 1) })

      for (let i = 0; i < numberOfContacts; i++) {
        const possibleContacts = users.filter(u => !existingContacts.has(u.id))
        const contactUser = faker.helpers.arrayElement(possibleContacts)
        existingContacts.add(contactUser.id)

        contactEntries.push({
          user_id: user.id,
          user_id_in_contact: contactUser.id,
          alias: faker.person.fullName(),
          created_at: faker.date.past(),
          updated_at: faker.date.past(),
        })

        // 20 at a time
        if (contactEntries.length === 20) {
          await bulkInsertContacts(contactEntries)
          contactsInsertCount += contactEntries.length
          contactEntries.length = 0 // Clear the array
        }
      }
    }

    // Insert remaining contact entries
    if (contactEntries.length > 0) {
      await bulkInsertContacts(contactEntries)
      contactsInsertCount += contactEntries.length
    }

    return contactsInsertCount

    async function bulkInsertContacts(entries) {
      const values = []
      const placeholders = entries
        .map((entry, index) => {
          const offset = index * 5
          values.push(entry.user_id, entry.user_id_in_contact, entry.alias, entry.created_at, entry.updated_at)
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
        })
        .join(', ')

      const query = `
        INSERT INTO contacts
        (user_id, user_id_in_contact, alias, created_at, updated_at)
        VALUES ${placeholders}
      `

      await client.query(query, values)
    }
  }

  async function run(fn) {
    console.time(fn.name)
    const count = await fn()
    console.timeEnd(fn.name)
    return count
  }

  async function printDatabaseSize() {
    const result = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS size
    `)
    console.log(`Database size: ${result.rows[0].size}`)
  }

  console.time('Seeding completed in')

  console.log('inserting users...')
  const usersInsertCount = await run(insertUsers)
  console.log(`inserted ${usersInsertCount} users\n`)

  console.log('inserting chats...')
  const chatsInsertCount = await run(insertChats)
  console.log(`inserted ${chatsInsertCount} chats\n`)

  console.log('inserting messages...')
  const { messagesInsertCount, recipientsInsertCount } = await run(insertMessages)
  console.log(`inserted ${messagesInsertCount} messages and ${recipientsInsertCount} message-recipients\n`)

  console.log('inserting contacts...')
  const contactsInsertCount = await run(insertContacts)
  console.log(`inserted ${contactsInsertCount} contacts`)

  console.log()
  console.timeEnd('Seeding completed in')
  await printDatabaseSize()

  await client.end()
}

seed().catch(e => console.error(e.stack))
