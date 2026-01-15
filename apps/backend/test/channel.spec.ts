import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { dataSource } from '../vitest.setup'
import { createChannelRouter } from '../src/controllers/channel'
import { ChannelRepository } from '../src/repositories/channel'
import { GroupRepository } from '../src/repositories/group'
import { UserRepository } from '../src/repositories/user'
import { createAuthMiddleware } from '../src/middleware/auth'
import { UserProfile } from '../src/models/user'
import { Group } from '../src/models/group'
import { Channel } from '../src/models/channel'
import { MockAuthService } from './mocks/auth-service'

describe('Channel routes', () => {
  let app: express.Express
  let channelRepo: ChannelRepository
  let userRepo: UserRepository
  let authUser: UserProfile
  let authCookie: string

  beforeAll(() => {
    channelRepo = new ChannelRepository(dataSource)
    userRepo = new UserRepository(dataSource)

    app = express()
    app.use(cookieParser())
    app.use(express.json())

    app.use(createAuthMiddleware())

    const channelService: any = {
      getChannel: (id: number) => channelRepo.findOne({ where: { id } }),
      getChannelsOfGroup: (groupId: number) => channelRepo.getChannelsByGroupId(groupId),
      createChannel: (groupId: number, dto: any) =>
        channelRepo.save(channelRepo.create({ name: dto.name, group: { id: groupId } })),
    }

    app.use('/api/channels', createChannelRouter(channelService))
  })

  beforeEach(async () => {
    MockAuthService.clearMockUsers()
    await dataSource.getRepository(Channel).deleteAll()
    await dataSource.getRepository(Group).deleteAll()
    await dataSource.getRepository(UserProfile).deleteAll()

    const authMockUser = MockAuthService.createMockUser({
      email: 'auth@c.test',
      username: 'authc',
    })
    authUser = await dataSource.getRepository(UserProfile).save({
      id: authMockUser.user_id,
      globalName: 'Auth C',
      bio: 'Auth user bio',
    })
    const token = MockAuthService.generateMockToken(authUser.id)
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${token}`
  })

  describe('GET /api/channels/:id', () => {
    it('returns 404 for non-existing channel', async () => {
      const res = await request(app).get('/api/channels/9999').set('Cookie', authCookie)
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid channel id param', async () => {
      const res = await request(app).get('/api/channels/abc').set('Cookie', authCookie)
      expect(res.status).toBe(400)
    })
  })
})
