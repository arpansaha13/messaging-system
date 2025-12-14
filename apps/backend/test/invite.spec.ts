import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { dataSource } from '../vitest.setup'
import { createInviteRouter } from '../src/controllers/invite'
import { InviteRepository } from '../src/repositories/invite'
import { GroupRepository } from '../src/repositories/group'
import { UserRepository } from '../src/repositories/user'
import { UserGroupRepository } from '../src/repositories/user-group'
import { User } from '../src/models/user'
import { Group } from '../src/models/group'
import { Channel } from '../src/models/channel'
import { Invite } from '../src/models/invite'
import { UserGroup } from '../src/models/user-group'
import { createAuthMiddleware } from '../src/middleware/auth'
import { SessionRepository } from '../src/repositories/session'
import { ChannelRepository } from '../src/repositories/channel'
import { Session } from '../src/models/session'
import { InviteService } from '../src/services/invite'

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

    const channelRepo = new ChannelRepository(dataSource)
    const inviteService = new InviteService(inviteRepo, userGroupRepo, channelRepo)

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

  describe('GET /api/invites/:hash', () => {
    it('returns invite by hash', async () => {
      const group = await groupRepo.save(groupRepo.create({ name: 'invite-group', founder: authUser }))

      const inv = await inviteRepo.save(
        inviteRepo.create({
          hash: 'testhash123',
          group: group,
          inviter: authUser,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        }),
      )

      const res = await request(app).get(`/api/invites/${inv.hash}`).set('Cookie', authCookie)

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
      expect(res.body.hash).toBe(inv.hash)
      expect(res.body.group).toBeDefined()
      expect(res.body.group.id).toBe(group.id)
    })
  })

  describe('POST /api/invites/:hash/accept', () => {
    it('accepts invite and adds user to group', async () => {
      // authUser is inviter
      await userRepo.createUser({ email: 'i3@test', username: 'i3', globalName: 'I3', password: 'pass' })
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

    it('returns 400/404 for invalid invite hash param', async () => {
      const badRes = await request(app).post('/api/invites//accept').set('Cookie', authCookie)
      expect([400, 404]).toContain(badRes.status)
    })
  })
})
