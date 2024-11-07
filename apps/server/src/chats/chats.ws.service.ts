import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { User } from 'src/users/user.entity'
import { Chat } from './chats.entity'
import { Message } from 'src/messages/message.entity'
import { MessageRecipient, MessageStatus } from 'src/message-recipient/message-recipient.entity'
import { MessageRecipientRepository } from 'src/message-recipient/message-recipient.repository'
import { In, type EntityManager } from 'typeorm'
import type { Server, Socket } from 'socket.io'
import {
  SocketOnEvent,
  type IReceiverEmitDelivered,
  type IReceiverEmitRead,
  type ISenderEmitMessage,
  type ISenderEmitTyping,
} from '@shared/types'

@Injectable()
export class ChatsWsService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,

    @InjectRepository(MessageRecipientRepository)
    private readonly messageRecipientRepository: MessageRecipientRepository,
  ) {}

  // TODO: Move this to an external cache
  private readonly clients = new Map<User['id'], Socket['id']>()

  handleConnect(socket: Socket) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    this.clients.set(parseInt(socket.handshake.query.userId as string), socket.id)
  }

  // TODO: check if room is unarchived if the receiver is offline
  handleDisconnect(socket: Socket) {
    this.clients.delete(parseInt(socket.handshake.query.userId as string))
  }

  async sendMessage(payload: ISenderEmitMessage, server: Server) {
    const receiverSocketId = this.clients.get(payload.receiverId)
    const senderSocketId = this.clients.get(payload.senderId)

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

    server.to(senderSocketId).emit(SocketOnEvent.SENT, {
      hash: payload.hash,
      messageId: message.id,
      createdAt: message.createdAt,
      receiverId: payload.receiverId,
      status: messageRecipient.status,
    })

    // If receiver is not connected to socket - could mean offline
    if (isNullOrUndefined(receiverSocketId)) return

    server.to(receiverSocketId).emit(SocketOnEvent.RECEIVE_MESSAGE, {
      messageId: message.id,
      content: payload.content,
      senderId: payload.senderId,
      createdAt: message.createdAt,
      status: messageRecipient.status,
    })
  }

  async handleDelivered(payload: IReceiverEmitDelivered, server: Server) {
    await this.messageRecipientRepository.update(
      { id: payload.messageId, receiver: { id: payload.receiverId } },
      { status: MessageStatus.DELIVERED },
    )

    const senderSocketId = this.clients.get(payload.senderId)

    server.to(senderSocketId).emit(SocketOnEvent.DELIVERED, {
      messageId: payload.messageId,
      receiverId: payload.receiverId,
      status: MessageStatus.DELIVERED,
    })
  }

  async handleRead(payload: IReceiverEmitRead | IReceiverEmitRead[], server: Server) {
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

    const senderSocketId = this.clients.get(payloadArray[0].senderId)
    server.to(senderSocketId).emit(SocketOnEvent.READ, readPayloadToSender)
  }

  handleTyping(payload: ISenderEmitTyping, server: Server) {
    const receiverSocketId = this.clients.get(payload.receiverId)
    server.to(receiverSocketId).emit(SocketOnEvent.TYPING, {
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      isTyping: payload.isTyping,
    })
  }
}
