import 'reflect-metadata'
import { createServer as createHttpServer } from 'node:http'
import { Server as SocketServer } from 'socket.io'
import AppDataSource from './data-source'
import { ChatsGateway } from './services/chats.gateway'
import { ChatsStoreService } from './services/chats-store'
import { PersonalChatsWsService } from './services/personal-chats.ws'
import { GroupChatsWsService } from './services/group-chats.ws'

const PORT = process.env.PORT || 4000

async function bootstrap() {
  try {
    await AppDataSource.initialize()
    console.log('Data source initialized')

    const httpServer = createHttpServer()
    const io = new SocketServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: process.env.CLIENT_DOMAIN || 'http://localhost:3000',
        credentials: true,
      },
    })

    // Initialize WebSocket services
    const chatsStore = new ChatsStoreService()
    const personalChatsService = new PersonalChatsWsService(chatsStore)
    const groupChatsService = new GroupChatsWsService(chatsStore)
    const chatsGateway = new ChatsGateway(personalChatsService, groupChatsService)
    chatsGateway.setup(io)

    httpServer.listen(PORT, () => {
      console.log(`WebSocket server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

bootstrap()
