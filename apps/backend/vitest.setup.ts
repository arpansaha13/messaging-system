import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { GenericContainer, Wait } from 'testcontainers'
import { User } from './src/models/user.entity'
import { Chat } from './src/models/chat.entity'
import { Group } from './src/models/group.entity'
import { Invite } from './src/models/invite.entity'
import { Session } from './src/models/session.entity'
import { Contact } from './src/models/contact.entity'
import { Channel } from './src/models/channel.entity'
import { UserGroup } from './src/models/user-group.entity'
import { UnverifiedUser } from './src/models/unverified-user.entity'
import { Message } from './src/models/message.entity'
import { MessageRecipient } from './src/models/message-recipient.entity'

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
process.env.DB_SYNCHRONIZE = process.env.DB_SYNCHRONIZE ?? 'true'
process.env.DB_LOGGING = process.env.DB_LOGGING ?? 'false'

process.env.CLIENT_DOMAIN = 'http://localhost:3000'
process.env.OTP_VALIDATION_SECONDS = '60' // shorter expiry for tests

process.env.CORS_ORIGINS = 'http://localhost:3000'

process.env.AUTH_COOKIE_NAME = 'test_session'

process.env.JWT_SECRET = 'test-secret-jwt-key'
process.env.JWT_TOKEN_VALIDITY_SECONDS = '300' // 5 minutes for test runs

process.env.SESSION_SECRET = 'test-secret-session-key'

process.env.MAIL_HOST = 'localhost'
process.env.MAIL_USER = 'testuser'
process.env.MAIL_PASSWORD = 'testpass'
process.env.MAIL_FROM = 'test@example.com'

process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_USERNAME = 'postgres'
process.env.DB_PASSWORD = 'postgres'
process.env.DB_NAME = 'test_db'

let container: any
export let dataSource: DataSource

beforeAll(async () => {
  container = await new GenericContainer('postgres:15.10-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'testdb',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forAll([Wait.forLogMessage('database system is ready to accept connections'), Wait.forListeningPorts()]),
    )
    .start()

  dataSource = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username: 'test',
    password: 'test',
    database: 'testdb',
    synchronize: true,
    logging: false,
    entities: [
      User,
      Session,
      UnverifiedUser,
      Contact,
      Channel,
      Chat,
      Group,
      Invite,
      MessageRecipient,
      Message,
      UserGroup,
    ],
  })

  await dataSource.initialize()
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
})

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy()
  if (container) await container.stop()
})
