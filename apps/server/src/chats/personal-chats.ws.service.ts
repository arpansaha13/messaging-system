import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { SocketEvents } from '@shared/constants'
import { User } from 'src/users/user.entity'
import { Chat } from './chats.entity'
import { ChatsStoreService } from './chats-store.service'
import { Message } from 'src/messages/message.entity'
import { MessageRecipient, MessageStatus } from 'src/message-recipient/message-recipient.entity'
import { MessageRecipientRepository } from 'src/message-recipient/message-recipient.repository'
import { In, type EntityManager } from 'typeorm'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

@Injectable()
export class PersonalChatsWsService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,

    @InjectRepository(MessageRecipientRepository)
    private readonly messageRecipientRepository: MessageRecipientRepository,

    private readonly chatsStore: ChatsStoreService,
  ) {}

  handleConnect(socket: Socket) {
    this.chatsStore.setClient(parseInt(socket.handshake.query.userId as string), socket.id)

    const channels = (socket.handshake.query.channels as string).split(',')
    socket.join(channels)

    const groups = (socket.handshake.query.groups as string).split(',')
    groups.forEach(groupId => this.chatsStore.addSocketToGroup(parseInt(groupId), socket.id))
  }

  handleDisconnect(socket: Socket) {
    this.chatsStore.deleteClient(parseInt(socket.handshake.query.userId as string))
  }

  async sendMessage(payload: SocketEventPayloads.Personal.EmitMessage, server: Server) {
    const receiverSocketId = this.chatsStore.getClient(payload.receiverId)
    const senderSocketId = this.chatsStore.getClient(payload.senderId)

    const { message, messageRecipient } = await this.manager
      .transaction(async txnManager => {
        const [sender, receiver] = await Promise.all([
          txnManager.findOneBy(User, { id: payload.senderId }),
          txnManager.findOneBy(User, { id: payload.receiverId }),
        ])

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
          const senderToReceiver = new Chat()
          senderToReceiver.sender_id = sender.id
          senderToReceiver.receiver_id = receiver.id
          await txnManager.save(senderToReceiver)
        }

        if (!receiverToSenderChatExists) {
          const receiverToSender = new Chat()
          receiverToSender.sender_id = receiver.id
          receiverToSender.receiver_id = sender.id
          await txnManager.save(receiverToSender)
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
      .catch(err => {
        console.log(err)
        throw new InternalServerErrorException('Error while sending the message')
      })

    server.to(senderSocketId).emit(SocketEvents.PERSONAL.STATUS_SENT, {
      hash: payload.hash,
      messageId: message.id,
      createdAt: message.createdAt,
      receiverId: payload.receiverId,
      status: messageRecipient.status,
    })

    // If receiver is not connected to socket - could mean offline
    if (isNullOrUndefined(receiverSocketId)) return

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
  }

  async handleDelivered(payload: SocketEventPayloads.Personal.EmitDelivered, server: Server) {
    await this.messageRecipientRepository.update(
      { id: payload.messageId, receiver: { id: payload.receiverId } },
      { status: MessageStatus.DELIVERED },
    )

    const senderSocketId = this.chatsStore.getClient(payload.senderId)

    server.to(senderSocketId).emit(SocketEvents.PERSONAL.STATUS_DELIVERED, {
      messageId: payload.messageId,
      receiverId: payload.receiverId,
      status: MessageStatus.DELIVERED,
    })
  }

  async handleRead(
    payload: SocketEventPayloads.Personal.EmitRead | SocketEventPayloads.Personal.EmitRead[],
    server: Server,
  ) {
    const payloadArray = Array.isArray(payload) ? payload : [payload]

    await this.messageRecipientRepository.update(
      {
        id: In(payloadArray.map(p => p.messageId)),
        receiver: { id: In(payloadArray.map(p => p.receiverId)) },
      },
      { status: MessageStatus.READ },
    )

    const readPayloadToSender = payloadArray.map(p => ({
      messageId: p.messageId,
      receiverId: p.receiverId,
      status: MessageStatus.READ,
    }))

    const senderSocketId = this.chatsStore.getClient(payloadArray[0].senderId)
    server.to(senderSocketId).emit(SocketEvents.PERSONAL.STATUS_READ, readPayloadToSender)
  }

  handleTyping(payload: SocketEventPayloads.Personal.EmitTyping, server: Server) {
    const receiverSocketId = this.chatsStore.getClient(payload.receiverId)
    server.to(receiverSocketId).emit(SocketEvents.PERSONAL.TYPING, {
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      isTyping: payload.isTyping,
    })
  }
}
