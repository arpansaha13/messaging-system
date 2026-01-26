import pg from 'pg'
import { config as dotEnvConfig } from 'dotenv'
import { insertUsers } from './users.mjs'
import { insertChats } from './chats.mjs'
import { insertMessages } from './messages.mjs'
import { insertContacts } from './contacts.mjs'
import { insertGroups } from './groups.mjs'
import { insertChannels } from './channels.mjs'
import { insertUserGroups } from './user-groups.mjs'
import { insertGroupMessages } from './group-messages.mjs'

dotEnvConfig()

/**
 * Validates mandatory environment variables
 */
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_NAME',
  'DB_PASSWORD',
  'AUTH_DB_HOST',
  'AUTH_DB_PORT',
  'AUTH_DB_USERNAME',
  'AUTH_DB_NAME',
  'AUTH_DB_PASSWORD',
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  throw new Error(
    `Missing mandatory environment variables:\n${missingVars.join('\n')}\n` +
      `Please check your .env file or environment configuration.`,
  )
}

// Messaging System Database Connection
const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.ENVIRONMENT === 'development' ? false : { rejectUnauthorized: false },
})

// Auth System Database Connection
const authClient = new pg.Client({
  host: process.env.AUTH_DB_HOST,
  port: Number.parseInt(process.env.AUTH_DB_PORT),
  user: process.env.AUTH_DB_USERNAME,
  database: process.env.AUTH_DB_NAME,
  password: process.env.AUTH_DB_PASSWORD,
  ssl: process.env.ENVIRONMENT === 'production',
})

async function seed() {
  await client.connect()
  await authClient.connect()

  console.group('Clearing existing data in Messaging System Database')

  await client.query('DELETE FROM message_recipients')
  console.log('deleted message_recipients')

  await client.query('DELETE FROM messages')
  console.log('deleted messages')

  await client.query('DELETE FROM contacts')
  console.log('deleted contacts')

  await client.query('DELETE FROM chats')
  console.log('deleted chats')

  await client.query('DELETE FROM channels')
  console.log('deleted channels')

  await client.query('DELETE FROM user_groups')
  console.log('deleted user_groups')

  await client.query('DELETE FROM invites')
  console.log('deleted invites')

  await client.query('DELETE FROM groups')
  console.log('deleted groups')

  await client.query('DELETE FROM user_profiles')
  console.log('deleted user_profiles')

  console.groupEnd()
  console.log()

  console.group('Clearing existing data in Auth System Database')

  await authClient.query('DELETE FROM otps')
  console.log('deleted otps')

  await authClient.query('DELETE FROM sessions')
  console.log('deleted sessions')

  await authClient.query('DELETE FROM credentials')
  console.log('deleted credentials')

  await authClient.query('DELETE FROM users')
  console.log('deleted users')

  console.groupEnd()
  console.log()

  async function run(fn) {
    console.time(fn.name)
    const count = await fn()
    console.timeEnd(fn.name)
    return count
  }

  async function printDatabaseSizes() {
    const messagingResult = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`)
    const authResult = await authClient.query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`)
    console.log(`Messaging System Database size: ${messagingResult.rows[0].size}`)
    console.log(`Auth System Database size: ${authResult.rows[0].size}`)
  }

  console.time('Seeding completed in')

  console.log('Inserting users to databases...')
  const users = await run(insertUsers.bind(this, client, authClient))

  console.log('Inserting chats...')
  const chats = await run(insertChats.bind(this, client, users.data))

  console.log('Inserting contacts...')
  await run(insertContacts.bind(this, client, users.data))

  console.log('Inserting groups...')
  const groups = await run(insertGroups.bind(this, client, users.data))

  console.log('Inserting user-groups...')
  await run(insertUserGroups.bind(this, client, users.data, groups.data))

  console.log('Inserting channels...')
  await run(insertChannels.bind(this, client, groups.data))

  console.log('Inserting messages...')
  await run(insertMessages.bind(this, client, chats.data))

  console.log('Inserting group messages...')
  await run(insertGroupMessages.bind(this, client, groups.data))

  console.timeEnd('Seeding completed in')
  await printDatabaseSizes()

  await client.end()
  await authClient.end()
}

seed().catch(e => {
  console.error('Seeding failed:')
  console.error(e.message)
  process.exit(1)
})
