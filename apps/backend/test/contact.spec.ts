import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createContactRouter } from '../src/controllers/contact.controller'
import { createAuthMiddleware } from '../src/middleware/auth.middleware'
import { ContactService } from '../src/services/contact.service'
import { ContactRepository } from '../src/repositories/contact.repository'
import { UserRepository } from '../src/repositories/user.repository'
import { SessionRepository } from '../src/repositories/session.repository'
import { User } from '../src/models/user.entity'
import { Session } from '../src/models/session.entity'
import { Contact } from '../src/models/contact.entity'
import jwt from 'jsonwebtoken'

describe('Contact routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let sessionRepo: SessionRepository
  let contactRepo: ContactRepository
  let contactService: ContactService
  let authUser: User
  let otherUser1: User
  let otherUser2: User
  let authToken: string
  let authCookie: string

  beforeAll(async () => {
    userRepo = new UserRepository(dataSource)
    sessionRepo = new SessionRepository(dataSource)
    contactRepo = new ContactRepository(dataSource)
    contactService = new ContactService(contactRepo, userRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware(sessionRepo, userRepo))
    app.use('/api/contacts', createContactRouter(contactService))
  })

  beforeEach(async () => {
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

    // Create other users
    otherUser1 = await userRepo.createUser({
      email: 'user1@example.com',
      globalName: 'User One',
      username: 'user1',
      password: 'password',
      bio: 'User one bio',
    })

    otherUser2 = await userRepo.createUser({
      email: 'user2@example.com',
      globalName: 'User Two',
      username: 'user2',
      password: 'password',
      bio: 'User two bio',
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

  describe('GET /api/contacts/', () => {
    it('returns all contacts when authenticated', async () => {
      // Create contacts
      await contactRepo.createContact(authUser, otherUser1, 'Friend 1')
      await contactRepo.createContact(authUser, otherUser2, 'Friend 2')

      const res = await request(app).get('/api/contacts/').set('Cookie', authCookie).expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
      expect(res.body[0]).toHaveProperty('alias')
      expect(res.body[0]).toHaveProperty('userInContact')
    })

    it('returns filtered contacts when search query provided', async () => {
      // Create contacts
      await contactRepo.createContact(authUser, otherUser1, 'John Friend')
      await contactRepo.createContact(authUser, otherUser2, 'Jane Friend')

      const res = await request(app).get('/api/contacts/?search=john').set('Cookie', authCookie).expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      const hasJohn = res.body.some(
        (c: any) =>
          c.alias.toLowerCase().includes('john') ||
          c.userInContact.globalName.toLowerCase().includes('john') ||
          c.userInContact.username.toLowerCase().includes('john'),
      )
      expect(hasJohn).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/contacts/').expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('POST /api/contacts/', () => {
    it('creates a new contact when authenticated', async () => {
      const newUser = await userRepo.createUser({
        email: 'newcontact@example.com',
        globalName: 'New Contact',
        username: 'newcontact',
        password: 'password',
        bio: 'New contact bio',
      })

      const res = await request(app)
        .post('/api/contacts/')
        .set('Cookie', authCookie)
        .send({ userIdToAdd: newUser.id, alias: 'New Friend' })
        .expect(201)

      expect(res.body).toHaveProperty('id')
      expect(res.body.alias).toBe('New Friend')
      expect(res.body.userInContact).toBeDefined()
      expect(res.body.userInContact.id).toBe(newUser.id)
    })

    it('returns 400 when trying to add self as contact', async () => {
      const res = await request(app)
        .post('/api/contacts/')
        .set('Cookie', authCookie)
        .send({ userIdToAdd: authUser.id, alias: 'Self' })
        .expect(400)

      expect(res.body.message).toBe('Invalid user ids')
    })

    it('returns 400 when contact already exists', async () => {
      await contactRepo.createContact(authUser, otherUser1, 'Existing Friend')

      const res = await request(app)
        .post('/api/contacts/')
        .set('Cookie', authCookie)
        .send({ userIdToAdd: otherUser1.id, alias: 'Duplicate' })
        .expect(400)

      expect(res.body.message).toBe('Contact already exists')
    })

    it('returns 400 when user does not exist', async () => {
      const res = await request(app)
        .post('/api/contacts/')
        .set('Cookie', authCookie)
        .send({ userIdToAdd: 99999, alias: 'Non-existent' })
        .expect(400)

      expect(res.body.message).toBe('Invalid user id')
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/contacts/')
        .send({ userIdToAdd: otherUser1.id, alias: 'Friend' })
        .expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/contacts/:contactId', () => {
    it('updates contact alias when authenticated', async () => {
      const contact = await contactRepo.createContact(authUser, otherUser1, 'Old Alias')

      await request(app)
        .patch(`/api/contacts/${contact.id}`)
        .set('Cookie', authCookie)
        .send({ new_alias: 'New Alias' })
        .expect(204)

      const updatedContact = await contactRepo.findOne({ where: { id: contact.id } })
      expect(updatedContact?.alias).toBe('New Alias')
    })

    it('returns 401 when not authenticated', async () => {
      const contact = await contactRepo.createContact(authUser, otherUser1, 'Friend')

      const res = await request(app).patch(`/api/contacts/${contact.id}`).send({ new_alias: 'New Alias' }).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('DELETE /api/contacts/:contactId', () => {
    it('deletes contact when authenticated', async () => {
      const contact = await contactRepo.createContact(authUser, otherUser1, 'Friend')

      await request(app).delete(`/api/contacts/${contact.id}`).set('Cookie', authCookie).expect(204)

      const deletedContact = await contactRepo.findOne({ where: { id: contact.id } })
      expect(deletedContact).toBeNull()
    })

    it('returns 401 when not authenticated', async () => {
      const contact = await contactRepo.createContact(authUser, otherUser1, 'Friend')

      const res = await request(app).delete(`/api/contacts/${contact.id}`).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })
})
