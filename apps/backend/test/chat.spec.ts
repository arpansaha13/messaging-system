import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createChatRouter } from '../src/controllers/chat'
import { createAuthMiddleware } from '../src/middleware/auth'
import { ChatService } from '../src/services/chat'
import { ChatRepository } from '../src/repositories/chat'
import { ContactRepository } from '../src/repositories/contact'
import { MessageRepository } from '../src/repositories/message'
import { UserRepository } from '../src/repositories/user'
import { SessionRepository } from '../src/repositories/session'
import { User } from '../src/models/user'
import { Session } from '../src/models/session'
import { Chat } from '../src/models/chat'
import { Message } from '../src/models/message'
import { MessageRecipient } from '../src/models/message-recipient'
import jwt from 'jsonwebtoken'
import { Contact } from '../src/models/contact'
import { MessageStatus } from '@shared/constants'

describe('Chat routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let sessionRepo: SessionRepository
  let chatRepo: ChatRepository
  let contactRepo: ContactRepository
  let messageRepo: MessageRepository
  let chatService: ChatService
  let authUser: User
  let receiverUser: User
  let authToken: string
  let authCookie: string

  beforeAll(async () => {
    userRepo = new UserRepository(dataSource)
    sessionRepo = new SessionRepository(dataSource)
    chatRepo = new ChatRepository(dataSource)
    contactRepo = new ContactRepository(dataSource)
    messageRepo = new MessageRepository(dataSource)
    chatService = new ChatService(chatRepo, contactRepo, messageRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware(sessionRepo, userRepo))
    app.use('/api/chats', createChatRouter(chatService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(MessageRecipient).deleteAll()
    await dataSource.getRepository(Message).deleteAll()
    await dataSource.getRepository(Chat).deleteAll()
    await dataSource.getRepository(Contact).deleteAll()
    await dataSource.getRepository(Session).deleteAll()
    await dataSource.getRepository(User).deleteAll()

    // Create authenticated user
    authUser = await userRepo.createUser({
      email: 'auth@example.com',
      globalName: 'Auth User',
      username: 'authuser',
      password: 'hashedpassword',
      bio: 'Auth user bio',
    })

    // Create receiver user
    receiverUser = await userRepo.createUser({
      email: 'receiver@example.com',
      globalName: 'Receiver User',
      username: 'receiveruser',
      password: 'password',
      bio: 'Receiver bio',
    })

    // Create session and cookie for authenticated requests
    const payload = { user_id: authUser.id }
    authToken = jwt.sign(payload, process.env.JWT_SECRET!)
    const jwtValiditySeconds = Number.parseInt(process.env.JWT_TOKEN_VALIDITY_SECONDS!)
    const session = await sessionRepo.save(
      sessionRepo.create({
        token: authToken,
        expiresAt: new Date(Date.now() + jwtValiditySeconds * 1000),
      }),
    )
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${session.key}`
  })

  describe('GET /api/chats/', () => {
    it('returns all chats when authenticated', async () => {
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })

      const res = await request(app).get('/api/chats/').set('Cookie', authCookie).expect(200)

      expect(res.body).toHaveProperty('unarchived')
      expect(res.body).toHaveProperty('archived')
      expect(Array.isArray(res.body.unarchived)).toBe(true)
      expect(Array.isArray(res.body.archived)).toBe(true)
    })

    it('returns empty arrays when no chats exist', async () => {
      const res = await request(app).get('/api/chats/').set('Cookie', authCookie).expect(200)

      expect(res.body.unarchived).toEqual([])
      expect(res.body.archived).toEqual([])
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/chats/').expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('GET /api/chats/:receiverId', () => {
    it('returns chat with receiver when authenticated', async () => {
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })
      // Seed contact so contact field is populated
      await contactRepo.createContact(authUser, receiverUser, 'Friend')
      // Seed latest message so message field is populated
      const msg = await messageRepo.saveMessage({
        content: 'hello there',
        sender: authUser,
      })
      await dataSource.getRepository(MessageRecipient).save({
        message: msg,
        receiver: receiverUser,
        status: MessageStatus.SENT,
      })

      const res = await request(app).get(`/api/chats/${receiverUser.id}`).set('Cookie', authCookie).expect(200)

      expect(res.body).toHaveProperty('chat')
      expect(res.body).toHaveProperty('message')
      expect(res.body.message.content).toBe('hello there')
      expect(res.body).toHaveProperty('contact')
      expect(res.body.contact.alias).toBe('Friend')
    })

    it('returns null when chat does not exist', async () => {
      const res = await request(app).get(`/api/chats/${receiverUser.id}`).set('Cookie', authCookie).expect(200)

      expect(res.body).toBeNull()
    })

    it('returns message field empty when no latest message exists', async () => {
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })

      const res = await request(app).get(`/api/chats/${receiverUser.id}`).set('Cookie', authCookie).expect(200)

      expect(res.body).toHaveProperty('chat')
      expect(res.body.message ?? null).toBeNull()
    })

    it('returns contact field empty when receiver is not in contacts', async () => {
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })
      // Seed a message so only contact is absent
      const msg = await messageRepo.saveMessage({
        content: 'hello receiver',
        sender: authUser,
      })
      await dataSource.getRepository(MessageRecipient).save({
        message: msg,
        receiver: receiverUser,
        status: MessageStatus.SENT,
      })

      const res = await request(app).get(`/api/chats/${receiverUser.id}`).set('Cookie', authCookie).expect(200)

      expect(res.body).toHaveProperty('chat')
      expect(res.body).toHaveProperty('message')
      expect(res.body.contact ?? null).toBeNull()
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/chats/${receiverUser.id}`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })

    it('returns 400 when receiverId is not a number', async () => {
      const res = await request(app).get('/api/chats/not-a-number').set('Cookie', authCookie).expect(400)
      expect(res.body.message).toBeDefined()
    })
  })

  describe('PATCH /api/chats/:receiverId/archive', () => {
    it('archives chat when authenticated', async () => {
      // Create chat
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })

      await request(app).patch(`/api/chats/${receiverUser.id}/archive`).set('Cookie', authCookie).expect(204)

      const chat = await chatRepo.findChat(authUser.id, receiverUser.id)
      expect(chat?.archived).toBe(true)
      expect(chat?.pinned).toBe(false) // Should be unpinned when archived
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).patch(`/api/chats/${receiverUser.id}/archive`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/chats/:receiverId/unarchive', () => {
    it('unarchives chat when authenticated', async () => {
      // Create archived chat
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: true,
        pinned: false,
      })

      await request(app).patch(`/api/chats/${receiverUser.id}/unarchive`).set('Cookie', authCookie).expect(204)

      const chat = await chatRepo.findChat(authUser.id, receiverUser.id)
      expect(chat?.archived).toBe(false)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).patch(`/api/chats/${receiverUser.id}/unarchive`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/chats/:receiverId/pin', () => {
    it('pins chat when authenticated', async () => {
      // Create chat
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })

      await request(app).patch(`/api/chats/${receiverUser.id}/pin`).set('Cookie', authCookie).expect(204)

      const chat = await chatRepo.findChat(authUser.id, receiverUser.id)
      expect(chat?.pinned).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).patch(`/api/chats/${receiverUser.id}/pin`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/chats/:receiverId/unpin', () => {
    it('unpins chat when authenticated', async () => {
      // Create pinned chat
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: true,
      })

      await request(app).patch(`/api/chats/${receiverUser.id}/unpin`).set('Cookie', authCookie).expect(204)

      const chat = await chatRepo.findChat(authUser.id, receiverUser.id)
      expect(chat?.pinned).toBe(false)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).patch(`/api/chats/${receiverUser.id}/unpin`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('DELETE /api/chats/:receiverId/clear', () => {
    it('clears chat when authenticated', async () => {
      // Create chat
      const beforeDate = new Date()
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: beforeDate,
        muted: false,
        archived: false,
        pinned: false,
      })

      await request(app).delete(`/api/chats/${receiverUser.id}/clear`).set('Cookie', authCookie).expect(204)

      const chat = await chatRepo.findChat(authUser.id, receiverUser.id)
      expect(chat?.clearedAt).toBeDefined()
      expect(new Date(chat!.clearedAt).getTime()).toBeGreaterThan(beforeDate.getTime())
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete(`/api/chats/${receiverUser.id}/clear`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('DELETE /api/chats/:receiverId/delete', () => {
    it('deletes chat when authenticated', async () => {
      // Create chat
      await chatRepo.saveChat({
        sender_id: authUser.id,
        receiver_id: receiverUser.id,
        clearedAt: new Date(),
        muted: false,
        archived: false,
        pinned: false,
      })

      await request(app).delete(`/api/chats/${receiverUser.id}/delete`).set('Cookie', authCookie).expect(204)

      const chat = await chatRepo.findChat(authUser.id, receiverUser.id)
      expect(chat).toBeNull()
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete(`/api/chats/${receiverUser.id}/delete`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })
})
