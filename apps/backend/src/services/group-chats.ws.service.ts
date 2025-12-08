import { SocketEvents, MessageStatus } from '@shared/constants'
import { ChatsStoreService } from './chats-store.service'
import AppDataSource from '../data-source'
import { Message } from '../models/message.entity'
import { MessageRecipient } from '../models/message-recipient.entity'
import { User } from '../models/user.entity'
import { Channel } from '../models/channel.entity'
import { UserGroup } from '../models/user-group.entity'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

export class GroupChatsWsService {
  constructor(private readonly chatsStore: ChatsStoreService) {}

  // Read receipts for for group chats - "DELIVERED" and "READ" - are not handled

  async handleNewGroup(payload: SocketEventPayloads.Group.EmitNewGroup, senderSocket: Socket) {
    this.chatsStore.addSocketToGroup(payload.groupId, senderSocket.id)
    senderSocket.join(payload.channels.split(','))
  }

  async handleNewChannel(payload: SocketEventPayloads.Group.EmitNewChannel, server: Server) {
    const socketsInGroup = this.chatsStore.getSocketsInGroup(payload.groupId)
    const roomId = payload.channelId.toString()

    if (socketsInGroup) {
      for (const socketId of socketsInGroup) {
        const socket = server.to(socketId)
        socket.socketsJoin(roomId)
        socket.emit(SocketEvents.GROUP.NEW_CHANNEL, { groupId: payload.groupId })
      }
    }
  }

  async handleJoinGroup(payload: SocketEventPayloads.Group.EmitJoinGroup, senderSocket: Socket) {
    this.chatsStore.addSocketToGroup(payload.groupId, senderSocket.id)
    senderSocket.join(payload.channels.split(','))
  }

  async sendMessage(payload: SocketEventPayloads.Group.EmitMessage, senderSocket: Socket) {
    const roomId = payload.channelId.toString()

    try {
      const { message } = await AppDataSource.manager.transaction(async txnManager => {
        const [sender, channel] = await Promise.all([
          txnManager.findOneBy(User, { id: payload.senderId }),
          txnManager.findOneBy(Channel, { id: payload.channelId }),
        ])

        if (!sender || !channel) {
          throw new Error('Sender or channel not found')
        }

        const receivers = (
          await txnManager.find(UserGroup, {
            select: ['id', 'user'],
            where: {
              group: { id: payload.groupId },
              user: { id: undefined }, // Will be filtered after fetching
            },
            relations: { user: true },
          })
        )
          .filter(ug => ug.user.id !== payload.senderId)
          .map(ug => ug.user)

        let message = new Message()
        message.content = payload.content
        message.sender = sender
        message.channel = channel
        message = await txnManager.save(message)

        await Promise.all(
          receivers.map(receiver => {
            const messageRecipient = new MessageRecipient()
            messageRecipient.message = message
            messageRecipient.receiver = receiver
            messageRecipient.status = MessageStatus.SENT
            return txnManager.save(messageRecipient)
          }),
        )

        return { message }
      })

      senderSocket.emit(SocketEvents.GROUP.STATUS_SENT, {
        hash: payload.hash,
        messageId: message.id,
        groupId: payload.groupId,
        channelId: payload.channelId,
        createdAt: message.createdAt.toString(),
        status: MessageStatus.SENT,
      })

      senderSocket.to(roomId).emit(SocketEvents.GROUP.MESSAGE_RECEIVE, {
        messageId: message.id,
        content: payload.content,
        senderId: payload.senderId,
        groupId: payload.groupId,
        channelId: payload.channelId,
        createdAt: message.createdAt.toString(),
        status: MessageStatus.SENT,
      })
    } catch (err) {
      console.error('Error sending group message:', err)
    }
  }
}
