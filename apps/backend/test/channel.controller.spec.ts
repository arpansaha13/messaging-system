import express, { type Request } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { dataSource } from '../vitest.setup'
import { createChannelRouter } from '../src/controllers/channel.controller'
import { ChannelRepository } from '../src/repositories/channel.repository'
import { GroupRepository } from '../src/repositories/group.repository'
import { UserRepository } from '../src/repositories/user.repository'
import { createAuthMiddleware } from '../src/middleware/auth.middleware'
import { SessionRepository } from '../src/repositories/session.repository'
import { User } from '../src/models/user.entity'
import { Group } from '../src/models/group.entity'
import { Channel } from '../src/models/channel.entity'

describe('Channel routes', () => {
  let app: express.Express
  let channelRepo: ChannelRepository
  let groupRepo: GroupRepository
  let userRepo: UserRepository
  let sessionRepo: SessionRepository
  let authUser: Request['user']
  let authCookie: string

  beforeAll(() => {
    channelRepo = new ChannelRepository(dataSource)
    groupRepo = new GroupRepository(dataSource)
    userRepo = new UserRepository(dataSource)

    app = express()
    app.use(cookieParser())
    app.use(express.json())

    sessionRepo = new SessionRepository(dataSource)
    app.use(createAuthMiddleware(sessionRepo, userRepo))

    const channelService: any = {
      getChannel: (id: number) => channelRepo.findOne({ where: { id } }),
      getChannelsOfGroup: (groupId: number) => channelRepo.getChannelsByGroupId(groupId),
      createChannel: (groupId: number, dto: any) =>
        channelRepo.save(channelRepo.create({ name: dto.name, group: { id: groupId } })),
    }

    app.use('/api/channels', createChannelRouter(channelService))
  })

  beforeEach(async () => {
    await dataSource.getRepository(Channel).deleteAll()
    await dataSource.getRepository(Group).deleteAll()
    await dataSource.getRepository(User).deleteAll()
    await dataSource
      .getRepository('sessions')
      .delete({})
      .catch(() => {})

    authUser = await userRepo.createUser({
      email: 'auth@c.test',
      username: 'authc',
      globalName: 'Auth C',
      password: 'pass',
    })
    const payload = { user_id: authUser.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET!)
    const session = await sessionRepo.save(sessionRepo.create({ token, expiresAt: new Date(Date.now() + 60_000) }))
    authCookie = `${process.env.AUTH_COOKIE_NAME}=${session.key}`
  })

  it('returns 404 for non-existing channel', async () => {
    const res = await request(app).get('/api/channels/9999').set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid channel id param', async () => {
    const res = await request(app).get('/api/channels/abc').set('Cookie', authCookie)
    expect(res.status).toBe(400)
  })
})
