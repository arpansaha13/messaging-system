import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createMessageRouter } from '../src/controllers/message'
import { MessageRepository } from '../src/repositories/message'
import { UserRepository } from '../src/repositories/user'
import { ChannelRepository } from '../src/repositories/channel'
import { MessageRecipient } from '../src/models/message-recipient'
import { Message } from '../src/models/message'
import { Chat } from '../src/models/chat'
import { Channel } from '../src/models/channel'
import { UserProfile } from '../src/models/user'
import { createAuthMiddleware } from '../src/middleware/auth'
import { MessageService } from '../src/services/message'
import { ChatRepository } from '../src/repositories/chat'
import { MockAuthService } from './mocks/auth-service'

describe('Message routes', () => {
  let app: express.Express
  let msgRepo: MessageRepository
  let userRepo: UserRepository
  let chatRepo: ChatRepository
  let channelRepo: ChannelRepository
  let authUser: UserProfile
  let authCookie: string

  beforeAll(() => {
    msgRepo = new MessageRepository(dataSource)
    userRepo = new UserRepository(dataSource)
    chatRepo = new ChatRepository(dataSource)
    channelRepo = new ChannelRepository(dataSource)

    const messageService = new MessageService(msgRepo, chatRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware())

    app.use('/api/messages', createMessageRouter(messageService))
  })

  beforeEach(async () => {
    MockAuthService.clearMockUsers()
    await dataSource.getRepository(MessageRecipient).deleteAll()
    await dataSource.getRepository(Message).deleteAll()
    await dataSource.getRepository(Chat).deleteAll()
    await dataSource.getRepository(Channel).deleteAll()
    await dataSource.getRepository(UserProfile).deleteAll()

    const authMockUser = MockAuthService.createMockUser({
      email: 'auth@g.test',
      username: 'authg',
    })
    authUser = await dataSource.getRepository(UserProfile).save({
      id: authMockUser.user_id,
      globalName: 'Auth G',
      bio: 'Auth user bio',
    })
    const token = MockAuthService.generateMockToken(authUser.id)
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${token}`
  })

  describe('GET /api/messages/:receiverId', () => {
    it('returns empty array if no chat/messages exist', async () => {
      const res = await request(app).get(`/api/messages/${authUser.id}`).set('Cookie', authCookie)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(0)
    })

    it('returns messages between users', async () => {
      // authUser is sender
      const receiverData = MockAuthService.createMockUser({
        email: 'm3@test',
        username: 'm3',
      })
      const receiver = await userRepo.createUser({
        id: receiverData.user_id,
        globalName: 'M3',
      })

      // create a message and recipient rows to satisfy query
      const msg = await msgRepo.save({ content: 'hello', sender: { id: authUser.id }, channel: null })
      await dataSource
        .getRepository('message_recipients')
        .save({ message: { id: msg.id }, receiver: { id: receiver.id }, status: 'SENT' })

      const res = await request(app).get(`/api/messages/${receiver.id}`).set('Cookie', authCookie)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('returns 400 for invalid receiver id param', async () => {
      const res = await request(app).get('/api/messages/abc').set('Cookie', authCookie)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/messages/channel/:channelId', () => {
    it('returns messages in a channel', async () => {
      const channel = await channelRepo.save(channelRepo.create({ name: 'room', group: null }))
      const msg = await dataSource
        .getRepository('messages')
        .save({ content: 'room msg', sender: { id: authUser.id }, channel: { id: channel.id } })

      const res = await request(app).get(`/api/messages/channel/${channel.id}`).set('Cookie', authCookie)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.find((m: any) => m.id === msg.id)).toBeDefined()
    })

    it('returns 400 for invalid channel id param', async () => {
      const res = await request(app).get('/api/messages/channel/xyz').set('Cookie', authCookie)
      expect(res.status).toBe(400)
    })
  })
})
