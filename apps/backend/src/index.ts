import 'reflect-metadata'
import express from 'express'
import cookieParser from 'cookie-parser'
import AppDataSource from './data-source'
import { createAuthMiddleware } from './middleware/auth'
import { createAuthRouter } from './controllers/auth'
import { createContactRouter } from './controllers/contact'
import { ContactService } from './services/contact'
import { ContactRepository } from './repositories/contact'
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
import { createUserRouter } from './controllers/user'
import { UserService } from './services/user'
import { UserRepository } from './repositories/user'
import { RabbitMQService } from './services/rabbitmq'
import { initializeAuthService, closeAuthService } from './services/auth'

const PORT = process.env.PORT || 4000

async function bootstrap() {
  try {
    // Initialize gRPC connection to auth service
    console.log('Connecting to auth service...')
    initializeAuthService()
    console.log('Auth service initialized')

    await AppDataSource.initialize()
    console.log('Data source initialized')

    const app = express()

    app.use(cookieParser())

    app.use(createAuthMiddleware())
    app.use(express.json())

    // Initialize repositories
    const contactRepo = new ContactRepository(AppDataSource)
    const groupRepo = new GroupRepository(AppDataSource)
    const channelRepo = new ChannelRepository(AppDataSource)
    const messageRepo = new MessageRepository(AppDataSource)
    const chatRepo = new ChatRepository(AppDataSource)
    const inviteRepo = new InviteRepository(AppDataSource)
    const userGroupRepo = new UserGroupRepository(AppDataSource)
    const userRepo = new UserRepository(AppDataSource)

    const rabbitmqService = new RabbitMQService()
    try {
      await rabbitmqService.connect()
    } catch (error) {
      console.error('Failed to connect to RabbitMQ, continuing without event publishing:', error)
    }

    // Initialize services
    const contactService = new ContactService(contactRepo)
    const groupService = new GroupService(groupRepo)
    const channelService = new ChannelService(channelRepo, rabbitmqService)
    const messageService = new MessageService(messageRepo, chatRepo)
    const chatService = new ChatService(chatRepo, contactRepo, messageRepo)
    const inviteService = new InviteService(inviteRepo, userGroupRepo, channelRepo)
    const userGroupService = new UserGroupService(userGroupRepo)
    const userService = new UserService(userRepo, contactRepo, userGroupRepo, channelRepo)

    // Setup routes
    app.use('/api/auth', createAuthRouter())
    app.use('/api/contacts', createContactRouter(contactService))
    app.use('/api/groups', createGroupRouter(groupService, userGroupService, channelService, inviteService))
    app.use('/api/channels', createChannelRouter(channelService))
    app.use('/api/messages', createMessageRouter(messageService))
    app.use('/api/chats', createChatRouter(chatService))
    app.use('/api/invites', createInviteRouter(inviteService))
    app.use('/api/user-group', createUserGroupRouter(userGroupService))
    app.use('/api/users', createUserRouter(userService))

    const server = app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully')

      // Close auth service connection
      await closeAuthService()
      console.log('Auth service disconnected')

      // Close RabbitMQ connection
      await rabbitmqService.disconnect()
      console.log('RabbitMQ disconnected')

      // Close HTTP server
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully')

      // Close auth service connection
      await closeAuthService()
      console.log('Auth service disconnected')

      // Close RabbitMQ connection
      await rabbitmqService.disconnect()
      console.log('RabbitMQ disconnected')

      // Close HTTP server
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

bootstrap()
