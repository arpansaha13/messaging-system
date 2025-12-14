import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { dataSource } from '../vitest.setup'
import { createMessageRouter } from '../src/controllers/message'
import { MessageRepository } from '../src/repositories/message'
import { UserRepository } from '../src/repositories/user'
import { ChannelRepository } from '../src/repositories/channel'
import { MessageRecipient } from '../src/models/message-recipient'
import { Message } from '../src/models/message'
import { Chat } from '../src/models/chat'
import { Channel } from '../src/models/channel'
import { User } from '../src/models/user'
import { createAuthMiddleware } from '../src/middleware/auth'
import { SessionRepository } from '../src/repositories/session'
import { MessageService } from '../src/services/message'
import { ChatRepository } from '../src/repositories/chat'
import { Session } from '../src/models/session'

describe('Message routes', () => {
  let app: express.Express
  let msgRepo: MessageRepository
  let userRepo: UserRepository
  let chatRepo: ChatRepository
  let channelRepo: ChannelRepository
  let sessionRepo: SessionRepository
  let authUser: Request['user']
  let authCookie: string

  beforeAll(() => {
    msgRepo = new MessageRepository(dataSource)
    userRepo = new UserRepository(dataSource)
    chatRepo = new ChatRepository(dataSource)
    channelRepo = new ChannelRepository(dataSource)
    sessionRepo = new SessionRepository(dataSource)

    const messageService = new MessageService(msgRepo, chatRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware(sessionRepo, userRepo))

    app.use('/api/messages', createMessageRouter(messageService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(MessageRecipient).deleteAll()
    await dataSource.getRepository(Message).deleteAll()
    await dataSource.getRepository(Chat).deleteAll()
    await dataSource.getRepository(Channel).deleteAll()
    await dataSource.getRepository(User).deleteAll()
    await dataSource.getRepository(Session).deleteAll()

    authUser = await userRepo.createUser({
      email: 'auth@g.test',
      username: 'authg',
      globalName: 'Auth G',
      password: 'pass',
    })
    const payload = { user_id: authUser.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET!)
    const session = await sessionRepo.save(sessionRepo.create({ token, expiresAt: new Date(Date.now() + 60_000) }))
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${session.key}`
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
      const receiver = await userRepo.createUser({
        email: 'm3@test',
        username: 'm3',
        globalName: 'M3',
        password: 'pass',
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
