import 'reflect-metadata'
import { createServer as createHttpServer } from 'node:http'
import express from 'express'
import { Server as SocketServer } from 'socket.io'
import cookieParser from 'cookie-parser'
import AppDataSource from './data-source'
import { authMiddleware } from './middleware/auth.middleware'
import { createUserRouter } from './controllers/user.controller'
import { UserService } from './services/user.service'
import { UserRepository } from './repositories/user.repository'
import { createContactRouter } from './controllers/contact.controller'
import { ContactService } from './services/contact.service'
import { ContactRepository } from './repositories/contact.repository'
import { createAuthRouter } from './controllers/auth.controller'
import { createGroupRouter } from './controllers/group.controller'
import { GroupService } from './services/group.service'
import { GroupRepository } from './repositories/group.repository'
import { createChannelRouter } from './controllers/channel.controller'
import { ChannelService } from './services/channel.service'
import { ChannelRepository } from './repositories/channel.repository'
import { createMessageRouter } from './controllers/message.controller'
import { MessageService } from './services/message.service'
import { MessageRepository } from './repositories/message.repository'
import { ChatRepository } from './repositories/chat.repository'
import { createChatRouter } from './controllers/chat.controller'
import { ChatService } from './services/chat.service'
import { createInviteRouter } from './controllers/invite.controller'
import { InviteService } from './services/invite.service'
import { InviteRepository } from './repositories/invite.repository'
import { createUserGroupRouter } from './controllers/user-group.controller'
import { UserGroupService } from './services/user-group.service'
import { UserGroupRepository } from './repositories/user-group.repository'
import { ChatsGateway } from './services/chats.gateway'
import { ChatsStoreService } from './services/chats-store.service'
import { PersonalChatsWsService } from './services/personal-chats.ws.service'
import { GroupChatsWsService } from './services/group-chats.ws.service'

const PORT = process.env.PORT || 4000

async function bootstrap() {
  try {
    await AppDataSource.initialize()
    console.log('Data source initialized')

    const app = express()
    const httpServer = createHttpServer(app)
    const io = new SocketServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    app.use(cookieParser())
    app.use(authMiddleware)
    app.use(express.json())

    // Initialize repositories
    const userRepo = new UserRepository()
    const contactRepo = new ContactRepository()
    const groupRepo = new GroupRepository()
    const channelRepo = new ChannelRepository()
    const messageRepo = new MessageRepository()
    const chatRepo = new ChatRepository()
    const inviteRepo = new InviteRepository()
    const userGroupRepo = new UserGroupRepository()

    // Initialize services
    const userService = new UserService(userRepo, contactRepo)
    const contactService = new ContactService(contactRepo)
    const groupService = new GroupService(groupRepo)
    const channelService = new ChannelService(channelRepo)
    const messageService = new MessageService(messageRepo, chatRepo)
    const chatService = new ChatService(chatRepo, contactRepo, messageRepo)
    const inviteService = new InviteService(inviteRepo, userGroupRepo, channelRepo)
    const userGroupService = new UserGroupService(userGroupRepo)

    // Initialize WebSocket services
    const chatsStore = new ChatsStoreService()
    const personalChatsService = new PersonalChatsWsService(chatRepo, messageRepo, chatsStore)
    const groupChatsService = new GroupChatsWsService(chatsStore)
    const chatsGateway = new ChatsGateway(personalChatsService, groupChatsService)
    chatsGateway.setup(io)

    // Setup routes
    app.use('/api/users', createUserRouter(userService))
    app.use('/api/contacts', createContactRouter(contactService))
    app.use('/api/auth', createAuthRouter())
    app.use('/api/groups', createGroupRouter(groupService, userGroupService, channelService, inviteService))
    app.use('/api/channels', createChannelRouter(channelService))
    app.use('/api/messages', createMessageRouter(messageService))
    app.use('/api/chats', createChatRouter(chatService))
    app.use('/api/invites', createInviteRouter(inviteService))
    app.use('/api/user-group', createUserGroupRouter(userGroupService))

    httpServer.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

bootstrap()
