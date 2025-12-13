import 'reflect-metadata'
import { createServer as createHttpServer } from 'node:http'
import express from 'express'
import { Server as SocketServer } from 'socket.io'
import cookieParser from 'cookie-parser'
import AppDataSource from './data-source'
import { createAuthMiddleware } from './middleware/auth'
import { createUserRouter } from './controllers/user'
import { UserService } from './services/user'
import { UserRepository } from './repositories/user'
import { SessionRepository } from './repositories/session'
import { createContactRouter } from './controllers/contact'
import { ContactService } from './services/contact'
import { ContactRepository } from './repositories/contact'
import { createAuthRouter } from './controllers/auth'
import { createGroupRouter } from './controllers/group'
import { GroupService } from './services/group'
import { GroupRepository } from './repositories/group'
import { createChannelRouter } from './controllers/channel'
import { ChannelService } from './services/channel'
import { ChannelRepository } from './repositories/channel'
import { createMessageRouter } from './controllers/message'
import { MessageService } from './services/message'
import { MessageRepository } from './repositories/message'
import { ChatRepository } from './repositories/chat'
import { createChatRouter } from './controllers/chat'
import { ChatService } from './services/chat'
import { createInviteRouter } from './controllers/invite'
import { InviteService } from './services/invite'
import { InviteRepository } from './repositories/invite'
import { createUserGroupRouter } from './controllers/user-group'
import { UserGroupService } from './services/user-group'
import { UserGroupRepository } from './repositories/user-group'
import { ChatsGateway } from './services/chats.gateway'
import { ChatsStoreService } from './services/chats-store'
import { PersonalChatsWsService } from './services/personal-chats.ws'
import { GroupChatsWsService } from './services/group-chats.ws'
import { AuthService } from './services/auth'
import { UnverifiedUserRepository } from './repositories/unverified-user'
import { MailService } from './services/mail'

const PORT = process.env.PORT || 4000

async function bootstrap() {
  try {
    await AppDataSource.initialize()
    console.log('Data source initialized')

    const app = express()
    const httpServer = createHttpServer(app)
    const io = new SocketServer(httpServer, {
      path: '/socket.io',
    })

    app.use(cookieParser())

    const userRepo = new UserRepository(AppDataSource)
    const sessionRepo = new SessionRepository(AppDataSource)

    app.use(createAuthMiddleware(sessionRepo, userRepo))
    app.use(express.json())

    // Initialize repositories
    const unverifiedUserRepo = new UnverifiedUserRepository(AppDataSource)
    const contactRepo = new ContactRepository(AppDataSource)
    const groupRepo = new GroupRepository(AppDataSource)
    const channelRepo = new ChannelRepository(AppDataSource)
    const messageRepo = new MessageRepository(AppDataSource)
    const chatRepo = new ChatRepository(AppDataSource)
    const inviteRepo = new InviteRepository(AppDataSource)
    const userGroupRepo = new UserGroupRepository(AppDataSource)

    // Initialize services
    const mailService = new MailService()
    const authService = new AuthService(userRepo, sessionRepo, unverifiedUserRepo, mailService)
    const userService = new UserService(userRepo, contactRepo, userGroupRepo, channelRepo)
    const contactService = new ContactService(contactRepo, userRepo)
    const groupService = new GroupService(groupRepo)
    const channelService = new ChannelService(channelRepo)
    const messageService = new MessageService(messageRepo, chatRepo)
    const chatService = new ChatService(chatRepo, contactRepo, messageRepo)
    const inviteService = new InviteService(inviteRepo, userGroupRepo, channelRepo)
    const userGroupService = new UserGroupService(userGroupRepo)

    // Initialize WebSocket services
    const chatsStore = new ChatsStoreService()
    const personalChatsService = new PersonalChatsWsService(chatsStore)
    const groupChatsService = new GroupChatsWsService(chatsStore)
    const chatsGateway = new ChatsGateway(personalChatsService, groupChatsService)
    chatsGateway.setup(io)

    // Setup routes
    app.use('/api/users', createUserRouter(userService))
    app.use('/api/contacts', createContactRouter(contactService))
    app.use('/api/auth', createAuthRouter(authService))
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
