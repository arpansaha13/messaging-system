import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { SocketEvents } from '@shared/constants'
import { MessageRecipientRepository } from 'src/message-recipient/message-recipient.repository'
import { Not, type EntityManager } from 'typeorm'
import { MessageRecipient, MessageStatus } from 'src/message-recipient/message-recipient.entity'
import { Message } from 'src/messages/message.entity'
import { User } from 'src/users/user.entity'
import { Channel } from 'src/channels/channel.entity'
import { UserGroup } from 'src/user_group/user-group.entity'
import { ChatsStoreService } from './chats-store.service'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

@Injectable()
export class GroupChatsWsService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,

    @InjectRepository(MessageRecipientRepository)
    private readonly messageRecipientRepository: MessageRecipientRepository,

    private readonly chatsStore: ChatsStoreService,
  ) {}

  // Read receipts for for group chats - "DELIVERED" and "READ" - are not handled

  async handleNewGroup(payload: SocketEventPayloads.Group.EmitNewGroup, senderSocket: Socket) {
    this.chatsStore.addSocketToGroup(payload.groupId, senderSocket.id)
    senderSocket.join(payload.channels.split(','))
  }

  async handleNewChannel(payload: SocketEventPayloads.Group.EmitNewChannel, server: Server) {
    const socketsInGroup = this.chatsStore.getSocketsInGroup(payload.groupId)
    const roomId = payload.channelId.toString()

    for (const socketId of socketsInGroup) {
      const socket = server.to(socketId)
      socket.socketsJoin(roomId)
      socket.emit(SocketEvents.GROUP.NEW_CHANNEL, { groupId: payload.groupId })
    }
  }

  async handleJoinGroup(payload: SocketEventPayloads.Group.EmitJoinGroup, senderSocket: Socket) {
    this.chatsStore.addSocketToGroup(payload.groupId, senderSocket.id)
    senderSocket.join(payload.channels.split(','))
  }

  async sendMessage(payload: SocketEventPayloads.Group.EmitMessage, senderSocket: Socket) {
    const roomId = payload.channelId.toString()

    const { message } = await this.manager
      .transaction(async txnManager => {
        const [sender, channel] = await Promise.all([
          txnManager.findOneBy(User, { id: payload.senderId }),
          txnManager.findOneBy(Channel, { id: payload.channelId }),
        ])

        const receivers = (
          await txnManager.find(UserGroup, {
            select: ['id', 'user'],
            where: { user: { id: Not(payload.senderId) }, group: { id: payload.groupId } },
            relations: { user: true },
          })
        ).map(ug => ug.user)

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
      .catch(err => {
        console.log(err)
        throw new InternalServerErrorException('Error while sending the message')
      })

    senderSocket.emit(SocketEvents.GROUP.STATUS_SENT, {
      hash: payload.hash,
      messageId: message.id,
      groupId: payload.groupId,
      channelId: payload.channelId,
      createdAt: message.createdAt.toString(),
      status: MessageStatus.SENT,
    } as SocketEventPayloads.Group.OnSent)

    senderSocket.to(roomId).emit(SocketEvents.GROUP.MESSAGE_RECEIVE, {
      messageId: message.id,
      content: payload.content,
      senderId: payload.senderId,
      groupId: payload.groupId,
      channelId: payload.channelId,
      createdAt: message.createdAt.toString(),
      status: MessageStatus.SENT,
    } as SocketEventPayloads.Group.OnMessage)
  }
}
