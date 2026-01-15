import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createContactRouter } from '../src/controllers/contact'
import { createAuthMiddleware } from '../src/middleware/auth'
import { ContactService } from '../src/services/contact'
import { ContactRepository } from '../src/repositories/contact'
import { UserRepository } from '../src/repositories/user'
import { UserProfile } from '../src/models/user'
import { Contact } from '../src/models/contact'
import { MockAuthService } from './mocks/auth-service'

describe('Contact routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let contactRepo: ContactRepository
  let contactService: ContactService
  let authUser: UserProfile
  let otherUser1: UserProfile
  let otherUser2: UserProfile
  let authCookie: string

  beforeAll(async () => {
    userRepo = new UserRepository(dataSource)
    contactRepo = new ContactRepository(dataSource)
    contactService = new ContactService(contactRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware())
    app.use('/api/contacts', createContactRouter(contactService))
  })

  beforeEach(async () => {
    MockAuthService.clearMockUsers()
    await dataSource.getRepository(Contact).deleteAll()
    await dataSource.getRepository(UserProfile).deleteAll()

    // Create authenticated user
    const authMockUser = MockAuthService.createMockUser({
      email: 'auth@example.com',
      username: 'authuser',
    })
    authUser = await dataSource.getRepository(UserProfile).save({
      id: authMockUser.user_id,
      globalName: 'Auth User',
      bio: 'Auth user bio',
    })

    // Create other users
    const otherMockUser1 = MockAuthService.createMockUser({
      email: 'user1@example.com',
      username: 'user1',
    })
    otherUser1 = await dataSource.getRepository(UserProfile).save({
      id: otherMockUser1.user_id,
      globalName: 'User One',
      bio: 'User one bio',
    })

    const otherMockUser2 = MockAuthService.createMockUser({
      email: 'user2@example.com',
      username: 'user2',
    })
    otherUser2 = await dataSource.getRepository(UserProfile).save({
      id: otherMockUser2.user_id,
      globalName: 'User Two',
      bio: 'User two bio',
    })

    // Create auth cookie
    const token = MockAuthService.generateMockToken(authUser.id)
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${token}`
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

      expect(res.body.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/contacts/', () => {
    it('creates a new contact when authenticated', async () => {
      const newUserData = MockAuthService.createMockUser({
        email: 'newcontact@example.com',
        username: 'newcontact',
      })
      const newUser = await userRepo.createUser({
        id: newUserData.user_id,
        globalName: 'New Contact',
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

      expect(res.body.message).toBe('User 99999 not found')
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/contacts/')
        .send({ userIdToAdd: otherUser1.id, alias: 'Friend' })
        .expect(401)

      expect(res.body.error).toBe('Unauthorized')
    })

    it('returns 400 when alias is empty', async () => {
      const res = await request(app)
        .post('/api/contacts/')
        .set('Cookie', authCookie)
        .send({ userIdToAdd: otherUser1.id, alias: '' })
        .expect(400)

      expect(res.body.message).toBeDefined()
    })

    it('returns 400 when userIdToAdd is not a number', async () => {
      const res = await request(app)
        .post('/api/contacts/')
        .set('Cookie', authCookie)
        .send({ userIdToAdd: 'abc', alias: 'Friend' })
        .expect(400)

      expect(res.body.message).toBeDefined()
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

      expect(res.body.error).toBe('Unauthorized')
    })

    it('returns 400 when alias is empty', async () => {
      const contact = await contactRepo.createContact(authUser, otherUser1, 'Friend')

      const res = await request(app)
        .patch(`/api/contacts/${contact.id}`)
        .set('Cookie', authCookie)
        .send({ new_alias: '' })
        .expect(400)

      expect(res.body.message).toBeDefined()
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

      expect(res.body.error).toBe('Unauthorized')
    })
  })
})
