import { Not } from 'typeorm'
import { SocketEvents, MessageStatus } from '@shared/constants'
import { ChatsStoreService } from './chats-store'
import AppDataSource from '../data-source'
import { User } from '../models/user'
import { Channel } from '../models/channel'
import { Message } from '../models/message'
import { UserGroup } from '../models/user-group'
import { MessageRecipient } from '../models/message-recipient'
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
              user: { id: Not(payload.senderId) },
            },
            relations: { user: true },
          })
        ).map(ug => ug.user)

        const message = await txnManager.save(
          txnManager.create(Message, {
            sender,
            channel,
            content: payload.content,
          }),
        )

        await Promise.all(
          receivers.map(receiver => {
            return txnManager.save(
              txnManager.create(MessageRecipient, {
                message,
                receiver,
                status: MessageStatus.SENT,
              }),
            )
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
