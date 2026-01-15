import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { createAuthMiddleware } from '../src/middleware/auth'
import { dataSource } from '../vitest.setup'
import { createGroupRouter } from '../src/controllers/group'
import { GroupRepository } from '../src/repositories/group'
import { ChannelRepository } from '../src/repositories/channel'
import { UserRepository } from '../src/repositories/user'
import { UserGroupRepository } from '../src/repositories/user-group'
import { InviteRepository } from '../src/repositories/invite'
import { GroupService } from '../src/services/group'
import { ChannelService } from '../src/services/channel'
import { UserGroupService } from '../src/services/user-group'
import { InviteService } from '../src/services/invite'
import { UserProfile } from '../src/models/user'
import { Group } from '../src/models/group'
import { Channel } from '../src/models/channel'
import { UserGroup } from '../src/models/user-group'
import { Invite } from '../src/models/invite'
import { Message } from '../src/models/message'
import { MessageRecipient } from '../src/models/message-recipient'
import { MockAuthService } from './mocks/auth-service'

describe('Group routes', () => {
  let app: express.Express
  let userRepo: UserRepository
  let groupRepo: GroupRepository
  let channelRepo: ChannelRepository
  let userGroupRepo: UserGroupRepository
  let inviteRepo: InviteRepository
  let authUser: UserProfile
  let authCookie: string

  beforeAll(() => {
    userRepo = new UserRepository(dataSource)
    groupRepo = new GroupRepository(dataSource)
    channelRepo = new ChannelRepository(dataSource)
    userGroupRepo = new UserGroupRepository(dataSource)
    inviteRepo = new InviteRepository(dataSource)

    const groupService = new GroupService(groupRepo)
    // Mock RabbitMQService for tests
    const mockRabbitMQService = { publishMessage: async () => {} } as any
    const channelService = new ChannelService(channelRepo, mockRabbitMQService)
    const userGroupService = new UserGroupService(userGroupRepo)
    const inviteService = new InviteService(inviteRepo, userGroupRepo, channelRepo)

    app = express()
    app.use(cookieParser())
    app.use(express.json())
    app.use(createAuthMiddleware())

    app.use('/api/groups', createGroupRouter(groupService, userGroupService, channelService, inviteService))
  })

  beforeEach(async () => {
    MockAuthService.clearMockUsers()
    await dataSource.getRepository(MessageRecipient).deleteAll()
    await dataSource.getRepository(Message).deleteAll()
    await dataSource.getRepository(Invite).deleteAll()
    await dataSource.getRepository(UserGroup).deleteAll()
    await dataSource.getRepository(Channel).deleteAll()
    await dataSource.getRepository(Group).deleteAll()
    await dataSource.getRepository(UserProfile).deleteAll()

    // create a default authenticated user and session for tests that need auth
    const authMockUser = MockAuthService.createMockUser({
      email: 'auth@g.test',
      username: 'authg',
    })
    authUser = await dataSource.getRepository(UserProfile).save({
      id: authMockUser.user_id,
      globalName: 'Auth G',
      bio: 'Auth user bio',
    })
    const token = MockAuthService.generateMockToken(authUser.id)
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${token}`
  })

  describe('POST /api/groups', () => {
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

    it('returns 400 for invalid create-group payload', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Content-Type', 'application/json')
        .set('Cookie', authCookie)
        .send({ name: '' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/groups/:id', () => {
    it('returns 404 for unknown group', async () => {
      const res = await request(app).get('/api/groups/9999').set('Cookie', authCookie)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/groups/:id/channels', () => {
    it('creates a channel under group', async () => {
      const created = await groupRepo.save(groupRepo.create({ name: 'grp', founder: authUser }))

      const postRes = await request(app)
        .post(`/api/groups/${created.id}/channels`)
        .set('Cookie', authCookie)
        .send({ name: 'chat' })

      expect(postRes.status).toBe(201)
      expect(postRes.body.groupId).toBe(created.id)
    })

    it('returns 400 for invalid create-channel payload', async () => {
      const created = await groupRepo.save(groupRepo.create({ name: 'grpX', founder: authUser }))

      const res = await request(app)
        .post(`/api/groups/${created.id}/channels`)
        .set('Content-Type', 'application/json')
        .set('Cookie', authCookie)
        .send({ name: '' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/groups/:id/channels', () => {
    it('lists channels for a group', async () => {
      const created = await groupRepo.save(groupRepo.create({ name: 'grpList', founder: authUser }))

      await channelRepo.save(channelRepo.create({ name: 'chat-list', group: created }))

      const listRes = await request(app).get(`/api/groups/${created.id}/channels`).set('Cookie', authCookie)

      expect(listRes.status).toBe(200)
      expect(Array.isArray(listRes.body)).toBe(true)
      expect(listRes.body.length).toBeGreaterThanOrEqual(1)
      expect(listRes.body[0].name).toBeDefined()
    })
  })

  describe('GET /api/groups/:id/members', () => {
    it('returns members of a group', async () => {
      const group = await groupRepo.save(groupRepo.create({ name: 'grp2', founder: authUser }))
      await userGroupRepo.save(userGroupRepo.create({ user: authUser, group: group }))

      const res = await request(app).get(`/api/groups/${group.id}/members`).set('Cookie', authCookie)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('POST /api/groups/:id/invites', () => {
    it('creates an invite for a group', async () => {
      const group = await groupRepo.save(groupRepo.create({ name: 'grp3', founder: authUser }))

      const res = await request(app).post(`/api/groups/${group.id}/invites`).set('Cookie', authCookie)

      expect(res.status).toBe(201)
      expect(res.body.hash).toBeDefined()
    })
  })
})
