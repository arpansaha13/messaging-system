import { SocketEvents, MessageStatus } from '@shared/constants'
import { ChatsStoreService } from './chats-store'
import { MemcachedService } from './memcached.service'
import AppDataSource from '../data-source'
import { Message } from '../models/message'
import { MessageRecipient } from '../models/message-recipient'
import { User } from '../models/user'
import { Chat } from '../models/chat'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

export class PersonalChatsWsService {
  constructor(
    private readonly chatsStore: ChatsStoreService,
    private readonly memcachedService: MemcachedService,
  ) {}

  handleConnect(socket: Socket) {
    const userId = Number.parseInt(socket.handshake.query.userId as string)
    this.chatsStore.setClient(userId, socket.id)

    const channels = (socket.handshake.query.channels as string).split(',')
    socket.join(channels)

    const groups = (socket.handshake.query.groups as string).split(',')
    groups.forEach((groupId: string) => this.chatsStore.addSocketToGroup(Number.parseInt(groupId), socket.id))

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

  handleDisconnect(socket: Socket) {
    const userId = Number.parseInt(socket.handshake.query.userId as string)
    this.chatsStore.deleteClient(userId)
  }

  async sendMessage(payload: SocketEventPayloads.Personal.EmitMessage, server: Server) {
    const receiverSocketId = this.chatsStore.getClient(payload.receiverId)
    const senderSocketId = this.chatsStore.getClient(payload.senderId)

    try {
      const { message, messageRecipient } = await AppDataSource.manager.transaction(async txnManager => {
        const [sender, receiver] = await Promise.all([
          txnManager.findOneBy(User, { id: payload.senderId }),
          txnManager.findOneBy(User, { id: payload.receiverId }),
        ])

        if (!sender || !receiver) {
          throw new Error('Sender or receiver not found')
        }

        const [senderToReceiverChatExists, receiverToSenderChatExists] = await Promise.all([
          txnManager.exists(Chat, {
            where: {
              sender_id: payload.senderId,
              receiver_id: payload.receiverId,
            },
          }),
          txnManager.exists(Chat, {
            where: {
              sender_id: payload.receiverId,
              receiver_id: payload.senderId,
            },
          }),
        ])

        if (!senderToReceiverChatExists) {
          const senderChat = new Chat()
          senderChat.sender_id = payload.senderId
          senderChat.receiver_id = payload.receiverId
          senderChat.clearedAt = new Date()
          senderChat.muted = false
          senderChat.archived = false
          senderChat.pinned = false
          await txnManager.save(senderChat)
        }

        if (!receiverToSenderChatExists) {
          const receiverChat = new Chat()
          receiverChat.sender_id = payload.receiverId
          receiverChat.receiver_id = payload.senderId
          receiverChat.clearedAt = new Date()
          receiverChat.muted = false
          receiverChat.archived = false
          receiverChat.pinned = false
          await txnManager.save(receiverChat)
        }

        let message = new Message()
        message.content = payload.content
        message.sender = sender
        message = await txnManager.save(message)

        let messageRecipient = new MessageRecipient()
        messageRecipient.message = message
        messageRecipient.receiver = receiver
        messageRecipient.status = MessageStatus.SENT
        messageRecipient = await txnManager.save(messageRecipient)

        return { message, messageRecipient }
      })

      if (senderSocketId) {
        server.to(senderSocketId).emit(SocketEvents.PERSONAL.STATUS_SENT, {
          hash: payload.hash,
          messageId: message.id,
          createdAt: message.createdAt,
          receiverId: payload.receiverId,
          status: messageRecipient.status,
        })
      }

      // If receiver is not connected to socket - could mean offline
      if (!receiverSocketId) {
        return
      }

      // FIXME: If the receiver is offline has this chat archived,
      // then this chat will stay archived even after getting a new message
      // This is because unarchive on new message is done on client-side on MESSAGE_RECEIVE
      server.to(receiverSocketId).emit(SocketEvents.PERSONAL.MESSAGE_RECEIVE, {
        messageId: message.id,
        content: payload.content,
        senderId: payload.senderId,
        createdAt: message.createdAt,
        status: messageRecipient.status,
      })
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  async handleDelivered(payload: SocketEventPayloads.Personal.EmitDelivered, server: Server) {
    try {
      await AppDataSource.manager.update(
        MessageRecipient,
        { message: { id: payload.messageId }, receiver: { id: payload.receiverId } },
        { status: MessageStatus.DELIVERED },
      )

      const senderSocketId = this.chatsStore.getClient(payload.senderId)

      if (senderSocketId) {
        server.to(senderSocketId).emit(SocketEvents.PERSONAL.STATUS_DELIVERED, {
          messageId: payload.messageId,
          receiverId: payload.receiverId,
          status: MessageStatus.DELIVERED,
        })
      }
    } catch (err) {
      console.error('Error handling delivered:', err)
    }
  }

  async handleRead(
    payload: SocketEventPayloads.Personal.EmitRead | SocketEventPayloads.Personal.EmitRead[],
    server: Server,
  ) {
    try {
      const payloadArray = Array.isArray(payload) ? payload : [payload]

      const messageIds = payloadArray.map(p => p.messageId)

      if (messageIds.length === 1) {
        await AppDataSource.manager.update(
          MessageRecipient,
          { message: { id: messageIds[0] } },
          { status: MessageStatus.READ },
        )
      } else {
        await AppDataSource.manager
          .createQueryBuilder()
          .update(MessageRecipient)
          .set({ status: MessageStatus.READ })
          .where('message.id IN (:...messageIds)', { messageIds })
          .execute()
      }

      const readPayloadToSender = payloadArray.map(p => ({
        messageId: p.messageId,
        receiverId: p.receiverId,
        status: MessageStatus.READ,
      }))

      const senderSocketId = this.chatsStore.getClient(payloadArray[0].senderId)
      if (senderSocketId) {
        server.to(senderSocketId).emit(SocketEvents.PERSONAL.STATUS_READ, readPayloadToSender)
      }
    } catch (err) {
      console.error('Error handling read:', err)
    }
  }

  handleTyping(payload: SocketEventPayloads.Personal.EmitTyping, server: Server) {
    const receiverSocketId = this.chatsStore.getClient(payload.receiverId)
    if (receiverSocketId) {
      server.to(receiverSocketId).emit(SocketEvents.PERSONAL.TYPING, {
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        isTyping: payload.isTyping,
      })
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
