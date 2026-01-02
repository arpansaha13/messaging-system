import { SocketEvents } from '@shared/constants'
import { ChatsStoreService } from './chats-store'
import { MemcachedService } from './memcached.service'
import { RabbitMQService } from './rabbitmq.service'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

export class PersonalChatsWsService {
  constructor(
    private readonly chatsStore: ChatsStoreService,
    private readonly memcachedService: MemcachedService,
    private readonly rabbitmqService: RabbitMQService,
    private readonly server: Server,
  ) {}

  async handleConnect(socket: Socket) {
    const userId = Number.parseInt(socket.handshake.query.userId as string)
    this.chatsStore.setClient(userId, socket.id)

    const channels = (socket.handshake.query.channels as string).split(',')
    socket.join(channels)

    const groups = (socket.handshake.query.groups as string).split(',')
    groups.forEach((groupId: string) => this.chatsStore.addSocketToGroup(Number.parseInt(groupId), socket.id))

    // Create RabbitMQ binding for this user
    try {
      await this.rabbitmqService.bindUserToQueue(userId)
    } catch (error) {
      console.error(`Error binding user ${userId} to queue:`, error)
    }

    // Track ping events for this socket
    this.setupPingTracking(socket, userId)
  }

  private setupPingTracking(socket: Socket, userId: number) {
    // Monitor socket.io ping packets
    // Reference: https://stackoverflow.com/questions/30207156/observe-the-ping-of-socketio-client-at-server-side
    socket.conn.on('packet', (packet: { type: string }) => {
      if (packet.type === 'pong') {
        this.chatsStore.trackPing(userId)
      }
    })
  }

  async handleDisconnect(socket: Socket) {
    const userId = Number.parseInt(socket.handshake.query.userId as string)
    this.chatsStore.deleteClient(userId)

    // Remove RabbitMQ binding for this user
    try {
      await this.rabbitmqService.unbindUserFromQueue(userId)
    } catch (error) {
      console.error(`Error unbinding user ${userId} from queue:`, error)
    }
  }

  async sendMessage(payload: SocketEventPayloads.Personal.EmitMessage) {
    try {
      // Basic validation
      if (!payload.content || !payload.senderId || !payload.receiverId || !payload.hash) {
        console.error('Invalid message payload:', payload)
        return
      }

      // Publish to incoming_messages exchange for worker to process
      await this.rabbitmqService.publishToIncoming('personal.message', {
        type: 'MESSAGE_SEND',
        payload,
      })
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  async handleDelivered(payload: SocketEventPayloads.Personal.EmitDelivered) {
    try {
      // Publish to incoming_messages exchange for worker to process
      await this.rabbitmqService.publishToIncoming('personal.delivered', {
        type: 'STATUS_DELIVERED',
        payload,
      })
    } catch (err) {
      console.error('Error handling delivered:', err)
    }
  }

  async handleRead(
    payload: SocketEventPayloads.Personal.EmitRead | SocketEventPayloads.Personal.EmitRead[],
  ) {
    try {
      const payloadArray = Array.isArray(payload) ? payload : [payload]

      // Publish to incoming_messages exchange for worker to process
      await this.rabbitmqService.publishToIncoming('personal.read', {
        type: 'STATUS_READ',
        payload: payloadArray,
      })
    } catch (err) {
      console.error('Error handling read:', err)
    }
  }

  async handleTyping(payload: SocketEventPayloads.Personal.EmitTyping) {
    try {
      // Publish directly to receiver using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for this userId
      await this.rabbitmqService.publishToOutgoing(payload.receiverId.toString(), {
        event: SocketEvents.PERSONAL.TYPING,
        userId: payload.receiverId,
        data: {
          senderId: payload.senderId,
          receiverId: payload.receiverId,
          isTyping: payload.isTyping,
        },
      })
    } catch (err) {
      console.error('Error handling typing:', err)
    }
  }

  async handleCheckOnline(payload: SocketEventPayloads.Personal.EmitCheckOnline, socket: Socket) {
    try {
      const statusMap = await this.memcachedService.getBatchOnlineStatus(payload.userIds)
      // Convert Map to Record for JSON serialization
      const statuses: Record<number, boolean> = {}
      statusMap.forEach((isOnline, userId) => {
        statuses[userId] = isOnline
      })
      socket.emit(SocketEvents.PERSONAL.CHECK_ONLINE_RESPONSE, {
        statuses,
      })
    } catch (error) {
      console.error('Error handling check online:', error)
      // Emit all false on error
      const statuses: Record<number, boolean> = {}
      payload.userIds.forEach(userId => {
        statuses[userId] = false
      })
      socket.emit(SocketEvents.PERSONAL.CHECK_ONLINE_RESPONSE, {
        statuses,
      })
    }
  }
}
