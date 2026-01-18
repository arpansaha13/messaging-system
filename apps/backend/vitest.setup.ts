import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { GenericContainer, Wait } from 'testcontainers'
import { Chat } from './src/models/chat'
import { Group } from './src/models/group'
import { Invite } from './src/models/invite'
import { Contact } from './src/models/contact'
import { Channel } from './src/models/channel'
import { UserGroup } from './src/models/user-group'
import { Message } from './src/models/message'
import { MessageRecipient } from './src/models/message-recipient'
import { UserProfile } from './src/models/user'
import { AuthService } from './src/services/auth'
import { MockAuthService } from './test/mocks/auth-service'

process.env.ENVIRONMENT = process.env.ENVIRONMENT ?? 'test'
process.env.DB_SYNCHRONIZE = process.env.DB_SYNCHRONIZE ?? 'true'
process.env.DB_LOGGING = process.env.DB_LOGGING ?? 'false'

process.env.CLIENT_DOMAIN = 'http://localhost:3000'
process.env.OTP_VALIDATION_SECONDS = '60' // shorter expiry for tests

process.env.AUTH_COOKIE_NAME = 'test_session'

process.env.JWT_SECRET = 'test-secret-jwt-key'
process.env.JWT_TOKEN_VALIDITY_SECONDS = '300' // 5 minutes for test runs

process.env.SESSION_SECRET = 'test-secret-session-key'

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
    entities: [Chat, Group, Invite, MessageRecipient, Message, UserGroup, Contact, Channel, UserProfile],
  })

  await dataSource.initialize()
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

  // Mock the AuthService gRPC calls
  mockAuthServiceGrpcCalls()
})

/**
 * Mock AuthService gRPC methods to use MockAuthService instead
 */
function mockAuthServiceGrpcCalls(): void {
  ;(AuthService as any).validateSession = MockAuthService.validateSession
  ;(AuthService as any).getUserByEmail = MockAuthService.getUserByEmail
  ;(AuthService as any).getUser = MockAuthService.getUser
}

afterAll(async () => {
  // Clear mock users after all tests
  MockAuthService.clearMockUsers()

  if (dataSource?.isInitialized) await dataSource.destroy()
  if (container) await container.stop()
})
