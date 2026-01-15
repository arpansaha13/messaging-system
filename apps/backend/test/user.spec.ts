import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createUserRouter } from '../src/controllers/user'
import { createAuthMiddleware } from '../src/middleware/auth'
import { UserService } from '../src/services/user'
import { UserRepository } from '../src/repositories/user'
import { ContactRepository } from '../src/repositories/contact'
import { ChannelRepository } from '../src/repositories/channel'
import { UserGroupRepository } from '../src/repositories/user-group'
import { UserProfile } from '../src/models/user'
import { Contact } from '../src/models/contact'
import { MockAuthService } from './mocks/auth-service'

describe('User routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let contactRepo: ContactRepository
  let userService: UserService
  let authUserId: number
  let authCookie: string

  beforeAll(async () => {
    userRepo = new UserRepository(dataSource)
    contactRepo = new ContactRepository(dataSource)

    const channelRepo = new ChannelRepository(dataSource)
    const userGroupRepo = new UserGroupRepository(dataSource)
    userService = new UserService(userRepo, contactRepo, userGroupRepo, channelRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware())
    app.use('/api/users', createUserRouter(userService))
  })

  beforeEach(async () => {
    MockAuthService.clearMockUsers()
    await dataSource.getRepository(Contact).deleteAll()
    await dataSource.getRepository(UserProfile).deleteAll()

    // Create authenticated user via mock auth service
    const authUserData = MockAuthService.createMockUser({
      email: 'auth@example.com',
      username: 'authuser',
    })
    authUserId = authUserData.user_id
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${MockAuthService.generateMockToken(authUserId)}`

    // Create user profile with additional data
    await userRepo.createUser({
      id: authUserId,
      globalName: 'Auth User',
      bio: 'Auth user bio',
    })
  })

  describe('GET /api/users/me', () => {
    it('returns authenticated user when authenticated', async () => {
      const res = await request(app).get('/api/users/me').set('Cookie', authCookie).expect(200)

      expect(res.body).toMatchObject({
        id: authUserId,
        globalName: 'Auth User',
        username: 'authuser',
      })
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/users/me').expect(401)

      expect(res.body.error).toBe('Unauthorized')
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

      expect(res.body.error).toBe('Unauthorized')
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
      // Create other users via mock auth service
      const otherUser1Data = MockAuthService.createMockUser({
        email: 'john@example.com',
        username: 'johndoe',
      })
      await userRepo.createUser({
        id: otherUser1Data.user_id,
        globalName: 'John Doe',
        bio: 'John bio',
      })

      const otherUser2Data = MockAuthService.createMockUser({
        email: 'jane@example.com',
        username: 'janesmith',
      })
      await userRepo.createUser({
        id: otherUser2Data.user_id,
        globalName: 'Jane Smith',
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

      expect(res.body.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/users/:id', () => {
    it('returns user with contact info when authenticated', async () => {
      const otherUserData = MockAuthService.createMockUser({
        email: 'other@example.com',
        username: 'otheruser',
      })
      const otherUserId = otherUserData.user_id
      await userRepo.createUser({
        id: otherUserId,
        globalName: 'Other User',
        bio: 'Other bio',
      })

      // Create contact relationship
      const otherUserProfile = await userRepo.findById(otherUserId)
      const authUserProfile = await userRepo.findById(authUserId)
      if (otherUserProfile && authUserProfile) {
        await contactRepo.createContact(authUserProfile, otherUserProfile, 'Friend')
      }

      const res = await request(app).get(`/api/users/${otherUserId}`).set('Cookie', authCookie).expect(200)

      expect(res.body.id).toBe(otherUserId)
    })

    it('returns user without contact when no contact exists', async () => {
      const otherUserData = MockAuthService.createMockUser({
        email: 'nocontact@example.com',
        username: 'nocontact',
      })
      const otherUserId = otherUserData.user_id
      await userRepo.createUser({
        id: otherUserId,
        globalName: 'No Contact',
        bio: 'No contact bio',
      })

      const res = await request(app).get(`/api/users/${otherUserId}`).set('Cookie', authCookie).expect(200)

      expect(res.body.id).toBe(otherUserId)
    })

    it('returns 404 when user not found', async () => {
      await request(app).get('/api/users/99999').set('Cookie', authCookie).expect(404)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/users/1').expect(401)
      expect(res.body.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/users/', () => {
    it.skip('creates a new user', async () => {
      const res = await request(app)
        .post('/api/users/')
        .set('Cookie', authCookie)
        .send({
          email: 'newuser@example.com',
          globalName: 'New User',
          username: 'newuser',
          password: 'password123',
          bio: 'New user bio',
        })
        .expect(201)

      expect(res.body.globalName).toBe('New User')
      expect(res.body.id).toBeDefined()
    })

    it('returns 400 for invalid payload', async () => {
      const res = await request(app).post('/api/users/').set('Cookie', authCookie).send({ globalName: '' }).expect(400)

      expect(res.body.message).toBeDefined()
    })
  })

  describe('PUT /api/users/:id', () => {
    it('updates user by id', async () => {
      const userData = MockAuthService.createMockUser({
        email: 'update@example.com',
        username: 'updateuser',
      })
      const userId = userData.user_id

      await userRepo.createUser({
        id: userId,
        globalName: 'Update User',
        bio: 'Original bio',
      })

      const updateData = { globalName: 'Updated Name', bio: 'Updated bio' }

      const res = await request(app).put(`/api/users/${userId}`).set('Cookie', authCookie).send(updateData).expect(200)

      expect(res.body.globalName).toBe(updateData.globalName)
      expect(res.body.bio).toBe(updateData.bio)
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('deletes user by id', async () => {
      const userData = MockAuthService.createMockUser({
        email: 'delete@example.com',
        username: 'deleteuser',
      })
      const userId = userData.user_id

      await userRepo.createUser({
        id: userId,
        globalName: 'Delete User',
        bio: 'Delete bio',
      })

      await request(app).delete(`/api/users/${userId}`).set('Cookie', authCookie).expect(204)

      const deletedUser = await userRepo.findById(userId)
      expect(deletedUser).toBeNull()
    })
  })
})
