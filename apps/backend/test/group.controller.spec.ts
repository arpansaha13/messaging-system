import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { createAuthMiddleware } from '../src/middleware/auth.middleware'
import { SessionRepository } from '../src/repositories/session.repository'
import { dataSource } from '../vitest.setup'
import { createGroupRouter } from '../src/controllers/group.controller'
import { GroupRepository } from '../src/repositories/group.repository'
import { ChannelRepository } from '../src/repositories/channel.repository'
import { UserRepository } from '../src/repositories/user.repository'
import { UserGroupRepository } from '../src/repositories/user-group.repository'
import { InviteRepository } from '../src/repositories/invite.repository'
import { GroupService } from '../src/services/group.service'
import { ChannelService } from '../src/services/channel.service'
import { UserGroupService } from '../src/services/user-group.service'
import { InviteService } from '../src/services/invite.service'
import { User } from '../src/models/user.entity'
import { Group } from '../src/models/group.entity'
import { Channel } from '../src/models/channel.entity'
import { UserGroup } from '../src/models/user-group.entity'
import { Invite } from '../src/models/invite.entity'
import { Message } from '../src/models/message.entity'
import { MessageRecipient } from '../src/models/message-recipient.entity'
import { Session } from '../src/models/session.entity'

describe('Group routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let groupRepo: GroupRepository
  let channelRepo: ChannelRepository
  let userGroupRepo: UserGroupRepository
  let inviteRepo: InviteRepository
  let sessionRepo: SessionRepository
  let authUser: Request['user']
  let authCookie: string

  beforeAll(() => {
    userRepo = new UserRepository(dataSource)
    groupRepo = new GroupRepository(dataSource)
    channelRepo = new ChannelRepository(dataSource)
    userGroupRepo = new UserGroupRepository(dataSource)
    inviteRepo = new InviteRepository(dataSource)
    sessionRepo = new SessionRepository(dataSource)

    const groupService = new GroupService(groupRepo)
    const channelService = new ChannelService(channelRepo)
    const userGroupService = new UserGroupService(userGroupRepo)
    const inviteService = new InviteService(inviteRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware(sessionRepo, userRepo))

    app.use('/api/groups', createGroupRouter(groupService, userGroupService, channelService, inviteService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(MessageRecipient).deleteAll()
    await dataSource.getRepository(Message).deleteAll()
    await dataSource.getRepository(Invite).deleteAll()
    await dataSource.getRepository(UserGroup).deleteAll()
    await dataSource.getRepository(Channel).deleteAll()
    await dataSource.getRepository(Group).deleteAll()
    await dataSource.getRepository(User).deleteAll()
    await dataSource.getRepository(Session).deleteAll()

    // create a default authenticated user and session for tests that need auth
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

  it('creates a group and returns created payload', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Content-Type', 'application/json')
      .set('Cookie', authCookie)
      .send({ name: 'My Group' })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(Array.isArray(res.body.channels)).toBe(true)
  })

  it('returns 404 for unknown group', async () => {
    const res = await request(app).get('/api/groups/9999').set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })

  it('creates a channel under group and lists channels', async () => {
    const created = await groupRepo.save(groupRepo.create({ name: 'grp', founder: authUser }))

    const postRes = await request(app)
      .post(`/api/groups/${created.id}/channels`)
      .set('Cookie', authCookie)
      .send({ name: 'chat' })

    expect(postRes.status).toBe(201)
    expect(postRes.body.groupId).toBe(created.id)

    const listRes = await request(app).get(`/api/groups/${created.id}/channels`).set('Cookie', authCookie)
    expect(listRes.status).toBe(200)
    expect(Array.isArray(listRes.body)).toBe(true)
  })

  it('returns members of a group', async () => {
    const group = await groupRepo.save(groupRepo.create({ name: 'grp2', founder: authUser }))
    await userGroupRepo.save(userGroupRepo.create({ user: authUser, group: group }))

    const res = await request(app).get(`/api/groups/${group.id}/members`).set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('creates an invite for a group', async () => {
    const group = await groupRepo.save(groupRepo.create({ name: 'grp3', founder: authUser }))

    const res = await request(app).post(`/api/groups/${group.id}/invites`).set('Cookie', authCookie)

    expect(res.status).toBe(201)
    expect(res.body.hash).toBeDefined()
  })
})
