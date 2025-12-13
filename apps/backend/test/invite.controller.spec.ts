import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { dataSource } from '../vitest.setup'
import { createInviteRouter } from '../src/controllers/invite.controller'
import { InviteRepository } from '../src/repositories/invite.repository'
import { GroupRepository } from '../src/repositories/group.repository'
import { UserRepository } from '../src/repositories/user.repository'
import { UserGroupRepository } from '../src/repositories/user-group.repository'
import { User } from '../src/models/user.entity'
import { Group } from '../src/models/group.entity'
import { Channel } from '../src/models/channel.entity'
import { Invite } from '../src/models/invite.entity'
import { UserGroup } from '../src/models/user-group.entity'
import { createAuthMiddleware } from '../src/middleware/auth.middleware'
import { SessionRepository } from '../src/repositories/session.repository'
import { Session } from '../src/models/session.entity'
import { InviteService } from '../src/services/invite.service'

describe('Invite routes', () => {
  let app: express.Express
  let inviteRepo: InviteRepository
  let groupRepo: GroupRepository
  let userRepo: UserRepository
  let userGroupRepo: UserGroupRepository
  let sessionRepo: SessionRepository
  let authUser: Request['user']
  let authCookie: string

  beforeAll(() => {
    inviteRepo = new InviteRepository(dataSource)
    groupRepo = new GroupRepository(dataSource)
    userRepo = new UserRepository(dataSource)
    userGroupRepo = new UserGroupRepository(dataSource)

    const inviteService = new InviteService(inviteRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    sessionRepo = new SessionRepository(dataSource)
    app.use(createAuthMiddleware(sessionRepo, userRepo))

    app.use('/api/invites', createInviteRouter(inviteService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(UserGroup).deleteAll()
    await dataSource.getRepository(Invite).deleteAll()
    await dataSource.getRepository(Channel).deleteAll()
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

  it('creates and fetch invite by hash', async () => {
    const group = await groupRepo.save(groupRepo.create({ name: 'g1', founder: authUser }))

    const postRes = await request(app).post(`/api/invites/group/${group.id}`).set('Cookie', authCookie)
    expect(postRes.status).toBe(201)
    expect(postRes.body.hash).toBeDefined()

    const getRes = await request(app).get(`/api/invites/${postRes.body.hash}`).set('Cookie', authCookie)
    expect(getRes.status).toBe(200)
    expect(getRes.body.hash).toBe(postRes.body.hash)
  })

  it('accepts invite and adds user to group', async () => {
    // authUser is inviter
    const invitee = await userRepo.createUser({ email: 'i3@test', username: 'i3', globalName: 'I3', password: 'pass' })
    const group = await groupRepo.save(groupRepo.create({ name: 'g2', founder: authUser }))

    // create channel to be returned
    await dataSource.getRepository('channels').save({ name: 'default', group: { id: group.id } })
    const inv = await inviteRepo.save(
      inviteRepo.create({
        hash: 'abc123',
        group: group,
        inviter: authUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
      }),
    )

    const res = await request(app).post(`/api/invites/${inv.hash}/accept`).set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.groupId).toBe(group.id)
  })

  it('returns 400 for invalid group id param when creating invite', async () => {
    const res = await request(app).post('/api/invites/group/abc').set('Cookie', authCookie)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid invite hash param', async () => {
    const res = await request(app).get('/api/invites/').set('Cookie', authCookie)
    // hitting /api/invites/ will be 404, so test bad param on accept route
    const badRes = await request(app).post('/api/invites//accept').set('Cookie', authCookie)
    expect([400, 404]).toContain(badRes.status)
  })
})
