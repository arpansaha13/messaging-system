import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createUserRouter } from '../src/controllers/user.controller'
import { createAuthMiddleware } from '../src/middleware/auth.middleware'
import { UserService } from '../src/services/user.service'
import { UserRepository } from '../src/repositories/user.repository'
import { ContactRepository } from '../src/repositories/contact.repository'
import { SessionRepository } from '../src/repositories/session.repository'
import { User } from '../src/models/user.entity'
import { Session } from '../src/models/session.entity'
import { Contact } from '../src/models/contact.entity'
import jwt from 'jsonwebtoken'

describe('User routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let sessionRepo: SessionRepository
  let contactRepo: ContactRepository
  let userService: UserService
  let authUser: User
  let authToken: string
  let authCookie: string

  beforeAll(async () => {
    userRepo = new UserRepository(dataSource)
    sessionRepo = new SessionRepository(dataSource)
    contactRepo = new ContactRepository(dataSource)
    userService = new UserService(userRepo, contactRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware(sessionRepo, userRepo))
    app.use('/api/users', createUserRouter(userService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(Contact).deleteAll()
    await dataSource.getRepository(Session).deleteAll()
    await dataSource.getRepository(User).deleteAll()

    // Create authenticated user for tests
    authUser = await userRepo.createUser({
      email: 'auth@example.com',
      globalName: 'Auth User',
      username: 'authuser',
      password: 'hashedpassword',
      bio: 'Auth user bio',
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

  describe('GET /api/users/me', () => {
    it('returns authenticated user when authenticated', async () => {
      const res = await request(app).get('/api/users/me').set('Cookie', authCookie).expect(200)

      expect(res.body).toMatchObject({
        id: authUser.id,
        email: authUser.email,
        globalName: authUser.globalName,
        username: authUser.username,
      })
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/users/me').expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/users/me', () => {
    it('updates authenticated user successfully', async () => {
      const updateData = { globalName: 'Updated Name', bio: 'Updated bio' }

      const res = await request(app).patch('/api/users/me').set('Cookie', authCookie).send(updateData).expect(200)

      expect(res.body.globalName).toBe(updateData.globalName)
      expect(res.body.bio).toBe(updateData.bio)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).patch('/api/users/me').send({ globalName: 'Updated Name' }).expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })

    it('returns 400 for invalid data', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', authCookie)
        .send({ email: 'invalid-email' })
        .expect(400)

      expect(res.body.message).toBeDefined()
    })
  })

  describe('GET /api/users/search', () => {
    it('returns search results when authenticated', async () => {
      // Create other users
      await userRepo.createUser({
        email: 'john@example.com',
        globalName: 'John Doe',
        username: 'johndoe',
        password: 'password',
        bio: 'John bio',
      })

      await userRepo.createUser({
        email: 'jane@example.com',
        globalName: 'Jane Smith',
        username: 'janesmith',
        password: 'password',
        bio: 'Jane bio',
      })

      const res = await request(app).get('/api/users/search?text=john').set('Cookie', authCookie).expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body.some((u: any) => u.globalName.toLowerCase().includes('john'))).toBe(true)
    })

    it('returns empty array when no query provided', async () => {
      const res = await request(app).get('/api/users/search').set('Cookie', authCookie).expect(200)

      expect(res.body).toEqual([])
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/users/search?text=test').expect(401)

      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('GET /api/users/', () => {
    it('returns all users', async () => {
      await userRepo.createUser({
        email: 'user1@example.com',
        globalName: 'User One',
        username: 'user1',
        password: 'password',
        bio: 'Bio 1',
      })

      await userRepo.createUser({
        email: 'user2@example.com',
        globalName: 'User Two',
        username: 'user2',
        password: 'password',
        bio: 'Bio 2',
      })

      const res = await request(app).get('/api/users/').set('Cookie', authCookie).expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(3) // authUser + 2 created
    })
  })

  describe('GET /api/users/:id', () => {
    it('returns user with contact info when authenticated', async () => {
      const otherUser = await userRepo.createUser({
        email: 'other@example.com',
        globalName: 'Other User',
        username: 'otheruser',
        password: 'password',
        bio: 'Other bio',
      })

      // Create contact relationship
      await contactRepo.createContact(authUser, otherUser, 'Friend')

      const res = await request(app).get(`/api/users/${otherUser.id}`).set('Cookie', authCookie).expect(200)

      expect(res.body.id).toBe(otherUser.id)
      expect(res.body.contact).toBeDefined()
      expect(res.body.contact.alias).toBe('Friend')
    })

    it('returns user without contact when no contact exists', async () => {
      const otherUser = await userRepo.createUser({
        email: 'nocontact@example.com',
        globalName: 'No Contact',
        username: 'nocontact',
        password: 'password',
        bio: 'No contact bio',
      })

      const res = await request(app).get(`/api/users/${otherUser.id}`).set('Cookie', authCookie).expect(200)

      expect(res.body.id).toBe(otherUser.id)
      expect(res.body.contact).toBeNull()
    })

    it('returns 404 when user not found', async () => {
      await request(app).get('/api/users/99999').set('Cookie', authCookie).expect(404)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/users/1').expect(401)
      expect(res.body.message).toBe('Unauthorized')
    })
  })

  describe('POST /api/users/', () => {
    it('creates a new user', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        globalName: 'New User',
        username: 'newuser',
        password: 'password123',
        bio: 'New user bio',
      }

      const res = await request(app).post('/api/users/').set('Cookie', authCookie).send(newUserData).expect(201)

      expect(res.body).toMatchObject({
        email: newUserData.email,
        globalName: newUserData.globalName,
        username: newUserData.username,
      })
      expect(res.body.id).toBeDefined()
    })
  })

  describe('PUT /api/users/:id', () => {
    it('updates user by id', async () => {
      const user = await userRepo.createUser({
        email: 'update@example.com',
        globalName: 'Update User',
        username: 'updateuser',
        password: 'password',
        bio: 'Original bio',
      })

      const updateData = { globalName: 'Updated Name', bio: 'Updated bio' }

      const res = await request(app).put(`/api/users/${user.id}`).set('Cookie', authCookie).send(updateData).expect(200)

      expect(res.body.globalName).toBe(updateData.globalName)
      expect(res.body.bio).toBe(updateData.bio)
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('deletes user by id', async () => {
      const user = await userRepo.createUser({
        email: 'delete@example.com',
        globalName: 'Delete User',
        username: 'deleteuser',
        password: 'password',
        bio: 'Delete bio',
      })

      await request(app).delete(`/api/users/${user.id}`).set('Cookie', authCookie).expect(204)

      const deletedUser = await userRepo.findById(user.id)
      expect(deletedUser).toBeNull()
    })
  })
})
