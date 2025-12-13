import express, { type Request } from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createUserGroupRouter } from '../src/controllers/user-group'
import { UserGroupRepository } from '../src/repositories/user-group'
import { GroupRepository } from '../src/repositories/group'
import { UserRepository } from '../src/repositories/user'
import { UserGroup } from '../src/models/user-group'
import { Group } from '../src/models/group'
import { User } from '../src/models/user'
import { createAuthMiddleware } from '../src/middleware/auth'
import { SessionRepository } from '../src/repositories/session'
import { Session } from '../src/models/session'
import { UserGroupService } from '../src/services/user-group'

describe('UserGroup routes', () => {
  let app: express.Express
  let userGroupRepo: UserGroupRepository
  let groupRepo: GroupRepository
  let userRepo: UserRepository
  let sessionRepo: SessionRepository
  let authUser: Request['user']
  let authCookie: string

  beforeAll(() => {
    userRepo = new UserRepository(dataSource)
    groupRepo = new GroupRepository(dataSource)
    userGroupRepo = new UserGroupRepository(dataSource)

    const userGroupService = new UserGroupService(userGroupRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    sessionRepo = new SessionRepository(dataSource)
    app.use(createAuthMiddleware(sessionRepo, userRepo))

    app.use('/api/user-groups', createUserGroupRouter(userGroupService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(UserGroup).deleteAll()
    await dataSource.getRepository(Group).deleteAll()
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

  it('returns groups of a user', async () => {
    const group = await groupRepo.save(groupRepo.create({ name: 'g1', founder: authUser }))
    await userGroupRepo.save(userGroupRepo.create({ user: authUser, group: group }))

    const res = await request(app).get(`/api/user-groups/user/${authUser.id}`).set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('allows joining a group', async () => {
    // authUser is the inviter
    const joiner = await userRepo.createUser({
      email: 'ug3@test',
      username: 'ug3',
      globalName: 'UG3',
      password: 'pass',
    })
    const group = await groupRepo.save(groupRepo.create({ name: 'g2', founder: authUser }))

    const res = await request(app).post(`/api/user-groups/group/${group.id}/join`).set('Cookie', authCookie)
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
  })

  it('returns 400 for invalid user id param', async () => {
    const res = await request(app).get('/api/user-groups/user/abc').set('Cookie', authCookie)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid group id param on join', async () => {
    const res = await request(app).post('/api/user-groups/group/NaN/join').set('Cookie', authCookie)
    expect(res.status).toBe(400)
  })
})
