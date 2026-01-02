import 'reflect-metadata'
import { createServer as createHttpServer } from 'node:http'
import { Server as SocketServer } from 'socket.io'
import AppDataSource from './data-source'
import { ChatsGateway } from './services/chats.gateway'
import { ChatsStoreService } from './services/chats-store'
import { PersonalChatsWsService } from './services/personal-chats.ws'
import { GroupChatsWsService } from './services/group-chats.ws'
import { MemcachedService } from './services/memcached.service'

const PORT = process.env.PORT || 4000
const PING_FLUSH_INTERVAL_MS = 5000 // 5 seconds
const ONLINE_STATUS_TTL = 60 // 60 seconds

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

    // Initialize services
    const chatsStore = new ChatsStoreService()
    const memcachedService = new MemcachedService()
    const personalChatsService = new PersonalChatsWsService(chatsStore, memcachedService)
    const groupChatsService = new GroupChatsWsService(chatsStore)
    const chatsGateway = new ChatsGateway(personalChatsService, groupChatsService)
    chatsGateway.setup(io)

    // Start periodic flush of ping tracking to memcached
    setInterval(async () => {
      try {
        const userIds = chatsStore.getAndClearPingTrackingSet()
        if (userIds.length > 0) {
          await memcachedService.setBatchOnline(userIds, ONLINE_STATUS_TTL)
        }
      } catch (error) {
        console.error('Error flushing ping tracking to memcached:', error)
      }
    }, PING_FLUSH_INTERVAL_MS)

    httpServer.listen(PORT, () => {
      console.log(`WebSocket server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

bootstrap()
