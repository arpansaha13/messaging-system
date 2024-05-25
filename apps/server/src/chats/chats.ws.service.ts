import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { User } from 'src/users/user.entity'
import { UserRepository } from 'src/users/user.repository'
import { Message } from 'src/messages/message.entity'
import { MessageRepository } from 'src/messages/message.repository'
import { MessageRecipient, MessageStatus } from 'src/message-recipient/message-recipient.entity'
import { MessageRecipientRepository } from 'src/message-recipient/message-recipient.repository'
import type { EntityManager } from 'typeorm'
import type { Server, Socket } from 'socket.io'
import type {
  IReceiverEmitDelivered,
  IReceiverEmitRead,
  ISenderEmitMessage,
  ISessionConnect,
  ISenderEmitTyping,
} from '@pkg/types'

@Injectable()
export class ChatsWsService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,

    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,

    @InjectRepository(MessageRepository)
    private readonly messageRepository: MessageRepository,

    @InjectRepository(MessageRecipientRepository)
    private readonly messageRecipientRepository: MessageRecipientRepository,
  ) {}

  /** A map of all clients (user_id's) to their client socket id's. */
  // TODO: Move this to an external cache
  private clients = new Map<User['id'], Socket['id']>()

  private getMapKeyByValue(socketId: Socket['id']): User['id'] {
    for (const [key, value] of this.clients.entries()) {
      if (value === socketId) return key
    }
  }

  addSession(payload: ISessionConnect, socket: Socket) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    this.clients.set(payload.userId, socket.id)
  }

  // TODO: check if room is unarchived if the receiver is offline
  handleDisconnect(socket: Socket) {
    const disconnectedUserId = this.getMapKeyByValue(socket.id)
    this.clients.delete(disconnectedUserId)
  }

  async sendMessage(payload: ISenderEmitMessage, server: Server) {
    const receiverSocketId = this.clients.get(payload.receiverId)
    const senderSocketId = this.clients.get(payload.senderId)

    const { message, messageRecipient } = await this.manager
      .transaction(async txnManager => {
        const sender = await txnManager.findOneBy(User, { id: payload.senderId })
        const receiver = await txnManager.findOneBy(User, { id: payload.receiverId })

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
        throw new InternalServerErrorException(' Error while sending the message')
      })

    server.to(senderSocketId).emit('sent', {
      hash: payload.hash,
      messageId: message.id,
      createdAt: message.createdAt,
      receiverId: payload.receiverId,
      status: messageRecipient.status,
    })

    // If receiver is not connected to socket - could mean offline
    if (isNullOrUndefined(receiverSocketId)) return

    server.to(receiverSocketId).emit('receive-message', {
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

    server.to(senderSocketId).emit('delivered', {
      messageId: payload.messageId,
      receiverId: payload.receiverId,
      status: MessageStatus.DELIVERED,
    })
  }

  async handleRead(payload: IReceiverEmitRead, server: Server) {
    await this.messageRecipientRepository.update(
      { id: payload.messageId, receiver: { id: payload.receiverId } },
      { status: MessageStatus.READ },
    )

    const senderSocketId = this.clients.get(payload.senderId)

    server.to(senderSocketId).emit('read', {
      messageId: payload.messageId,
      receiverId: payload.receiverId,
      status: MessageStatus.READ,
    })
  }

  handleTyping(payload: ISenderEmitTyping, server: Server) {
    const receiverSocketId = this.clients.get(payload.receiverId)
    server.to(receiverSocketId).emit('typing', {
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      isTyping: payload.isTyping,
    })
  }
}
