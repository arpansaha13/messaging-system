import pg from 'pg'
import { config as dotEnvConfig } from 'dotenv'
import { insertUsers } from './users.mjs'
import { insertChats } from './chats.mjs'
import { insertMessages } from './messages.mjs'
import { insertContacts } from './contacts.mjs'
import { insertGroups } from './groups.mjs'
import { insertChannels } from './channels.mjs'
import { insertUserGroups } from './user-groups.mjs'

dotEnvConfig()

const client = new pg.Client({
  host: process.env.TYPEORM_HOST,
  user: process.env.TYPEORM_USERNAME,
  database: process.env.TYPEORM_DATABASE,
  password: process.env.TYPEORM_PASSWORD,
  port: parseInt(process.env.TYPEORM_PORT ?? '5432'),
  ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false },
})

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

  await client.query('DELETE FROM channels')
  console.log('deleted channels')

  await client.query('DELETE FROM user_group')
  console.log('deleted user_group')

  await client.query('DELETE FROM groups')
  console.log('deleted groups')

  await client.query('DELETE FROM users')
  console.log('deleted users')

  console.groupEnd()
  console.log()

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
  const users = await run(insertUsers.bind(this, client))
  console.log(`inserted ${users.count} users\n`)

  console.log('inserting chats...')
  const chats = await run(insertChats.bind(this, client, users.data))
  console.log(`inserted ${chats.count} chats\n`)

  console.log('inserting messages...')
  const { messagesInsertCount, recipientsInsertCount } = await run(insertMessages.bind(this, client, chats.data))
  console.log(`inserted ${messagesInsertCount} messages and ${recipientsInsertCount} message-recipients\n`)

  console.log('inserting contacts...')
  const contactsInsertCount = await run(insertContacts.bind(this, client, users.data))
  console.log(`inserted ${contactsInsertCount} contacts\n`)

  console.log('inserting groups...')
  const groups = await run(insertGroups.bind(this, client, users.data))
  console.log(`inserted ${groups.count} groups\n`)

  console.log('inserting user-groups...')
  const userGroups = await run(insertUserGroups.bind(this, client, users.data, groups.data))
  console.log(`inserted ${userGroups.count} user-groups\n`)

  console.log('inserting channels...')
  const channels = await run(insertChannels.bind(this, client, groups.data))
  console.log(`inserted ${channels.count} channels`)

  console.log()
  console.timeEnd('Seeding completed in')
  await printDatabaseSize()

  await client.end()
}

seed().catch(e => console.error(e.stack))
