import bcrypt from 'bcryptjs'
import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createAuthRouter } from '../src/controllers/auth'
import { AuthService } from '../src/services/auth'
import { UserRepository } from '../src/repositories/user'
import { SessionRepository } from '../src/repositories/session'
import { UnverifiedUserRepository } from '../src/repositories/unverified-user'
import { MailService } from '../src/services/mail'
import { User } from '../src/models/user'
import { Session } from '../src/models/session'
import { UnverifiedUser } from '../src/models/unverified-user'

describe('Auth routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let sessionRepo: SessionRepository

  beforeAll(async () => {
    userRepo = new UserRepository(dataSource)
    sessionRepo = new SessionRepository(dataSource)
    const unverifiedRepo = new UnverifiedUserRepository(dataSource)
    const mailService = new MailService()
    const authService = new AuthService(userRepo, sessionRepo, unverifiedRepo, mailService)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use('/api/auth', createAuthRouter(authService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(Session).deleteAll()
    await dataSource.getRepository(UnverifiedUser).deleteAll()
    await dataSource.getRepository(User).deleteAll()
  })

  describe('POST /api/auth/login', () => {
    it('returns 400 for invalid login payload', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' }).expect(400)
      expect(res.body.message).toBeDefined()
    })

    it('logs in successfully with valid credentials and sets auth cookie', async () => {
      const password = 'password123'
      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt())

      await userRepo.createUser({
        email: 'test@example.com',
        globalName: 'Test User',
        username: 'testuser',
        password: hashedPassword,
        bio: 'Hey there!',
      })

      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password }).expect(200)

      expect(res.headers['set-cookie']).toBeDefined()
    })

    it('returns 401 for invalid credentials', async () => {
      await userRepo.createUser({
        email: 'test@example.com',
        globalName: 'Test User',
        username: 'testuser2',
        password: await bcrypt.hash('password123', await bcrypt.genSalt()),
        bio: 'Hey there!',
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong-password' })
        .expect(401)

      expect(res.body.message).toBe('Invalid credentials')
    })
  })

  describe('POST /api/auth/sign-up', () => {
    it('returns 400 for invalid sign-up payload', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({ email: 'bad', globalName: '', password: '123' })
        .expect(400)
      expect(res.body.message).toBeDefined()
    })
  })
})
