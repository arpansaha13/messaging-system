import { createServer as createHttpServer } from 'node:http'
import { Server as SocketServer } from 'socket.io'
import { ChatsGateway } from './services/chats.gateway'
import { ChatsStoreService } from './services/chats-store'
import { PersonalChatsWsService } from './services/personal-chats.ws'
import { GroupChatsWsService } from './services/group-chats.ws'
import { MemcachedService } from './services/memcached.service'
import { RabbitMQService } from './services/rabbitmq.service'

const PORT = process.env.PORT || 4000
const PING_FLUSH_INTERVAL_MS = 5000 // 5 seconds
const ONLINE_STATUS_TTL = 60 // 60 seconds

async function bootstrap() {
  try {
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
    const rabbitmqService = new RabbitMQService(memcachedService)

    // Connect to RabbitMQ
    await rabbitmqService.connect()

    const personalChatsService = new PersonalChatsWsService(chatsStore, memcachedService, rabbitmqService, io)
    const groupChatsService = new GroupChatsWsService(chatsStore, rabbitmqService, io)
    const chatsGateway = new ChatsGateway(personalChatsService, groupChatsService)
    chatsGateway.setup(io)

    // Setup RabbitMQ consumer for server queue (client events)
    await rabbitmqService.consumeFromServerQueue((message, ack) => {
      try {
        const { event, userId, channelId, groupId, data } = message

        // Handle user-targeted events (e.g., personal messages)
        if (userId) {
          const socketId = chatsStore.getClient(userId)
          if (socketId) {
            io.to(socketId).emit(event, data)
          }
        }
        // Handle channel-targeted events (e.g., group messages)
        else if (channelId) {
          const roomId = channelId.toString()
          io.to(roomId).emit(event, data)
        }
        // Handle group-targeted events (e.g., channel creation)
        else if (groupId) {
          const roomId = `group-${groupId}`
          io.to(roomId).emit(event, data)
        }

        ack()
      } catch (error) {
        console.error('Error processing message from RabbitMQ server queue:', error)
        ack() // Acknowledge to prevent infinite retries
      }
    })

    await rabbitmqService.consumeFromSubscriptionQueue(async (message, ack) => {
      try {
        const { userId, groupIds, channelIds } = message

        const socketId = chatsStore.getClient(userId)
        if (socketId) {
          const socket = io.sockets.sockets.get(socketId)
          if (socket) {
            // Bind each channel and group to this server's queue
            const bindPromises = []
            for (const channelId of channelIds) {
              bindPromises.push(rabbitmqService.bindChannelToQueue(channelId))
            }
            for (const groupId of groupIds) {
              bindPromises.push(rabbitmqService.bindGroupToQueue(groupId))
            }
            await Promise.all(bindPromises)

            // Join Socket.IO rooms for each channel
            socket.join(channelIds.map(id => id.toString()))

            // Store channels and groups in chats store with reference counting
            chatsStore.addUserChannels(userId, channelIds)
            chatsStore.addUserGroups(userId, groupIds)

            // Subscribe user to group rooms
            groupIds.forEach((groupId: number) => {
              chatsStore.addSocketToGroup(groupId, socketId)
              socket.join(`group-${groupId}`)
            })

            console.log(
              `Subscribed user ${userId} to channels=[${channelIds.join(',')}], groups=[${groupIds.join(',')}]`,
            )
          }
        }

        ack()
      } catch (error) {
        console.error('Error processing subscription message:', error)
        ack() // Acknowledge to prevent infinite retries
      }
    })

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

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully')
      await rabbitmqService.disconnect()
      httpServer.close(() => {
        process.exit(0)
      })
    })

    httpServer.listen(PORT, () => {
      console.log(`WebSocket server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

bootstrap()
