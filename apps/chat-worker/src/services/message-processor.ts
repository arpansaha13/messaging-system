import { MessageStatus, SocketEvents } from '@shared/constants'
import AppDataSource from '../data-source'
import { Message } from '../models/message'
import { MessageRecipient } from '../models/message-recipient'
import { User } from '../models/user'
import { Chat } from '../models/chat'
import { Channel } from '../models/channel'
import { UserGroup } from '../models/user-group'
import { Not } from 'typeorm'
import type { SocketEventPayloads } from '@shared/types'
import type { RabbitMQService } from './rabbitmq.service'

export class MessageProcessor {
  constructor(private readonly rabbitmqService: RabbitMQService) {}

  async processPersonalMessage(payload: SocketEventPayloads.Personal.EmitMessage): Promise<void> {
    try {
      const { message, messageRecipient } = await AppDataSource.manager.transaction(async txnManager => {
        const [sender, receiver] = await Promise.all([
          txnManager.findOneBy(User, { id: payload.senderId }),
          txnManager.findOneBy(User, { id: payload.receiverId }),
        ])

        if (!sender || !receiver) {
          throw new Error('Sender or receiver not found')
        }

        // Create chats if they don't exist
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

        // Create message
        let message = new Message()
        message.content = payload.content
        message.sender = sender
        message = await txnManager.save(message)

        // Create message recipient
        let messageRecipient = new MessageRecipient()
        messageRecipient.message = message
        messageRecipient.receiver = receiver
        messageRecipient.status = MessageStatus.SENT
        messageRecipient = await txnManager.save(messageRecipient)

        return { message, messageRecipient }
      })

      // Publish SENT event to sender using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for this userId
      await this.rabbitmqService.publishToOutgoing(payload.senderId.toString(), {
        event: SocketEvents.PERSONAL.STATUS_SENT,
        userId: payload.senderId,
        data: {
          hash: payload.hash,
          messageId: message.id,
          createdAt: message.createdAt,
          receiverId: payload.receiverId,
          status: messageRecipient.status,
        },
      })

      // Publish message to receiver using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for this userId
      await this.rabbitmqService.publishToOutgoing(payload.receiverId.toString(), {
        event: SocketEvents.PERSONAL.MESSAGE_RECEIVE,
        userId: payload.receiverId,
        data: {
          messageId: message.id,
          content: payload.content,
          senderId: payload.senderId,
          createdAt: message.createdAt,
          status: messageRecipient.status,
        },
      })
    } catch (error) {
      console.error('Error processing personal message:', error)
      throw error
    }
  }

  async processGroupMessage(payload: SocketEventPayloads.Group.EmitMessage): Promise<void> {
    try {
      const { message, receivers } = await AppDataSource.manager.transaction(async txnManager => {
        const [sender, channel] = await Promise.all([
          txnManager.findOneBy(User, { id: payload.senderId }),
          txnManager.findOneBy(Channel, { id: payload.channelId }),
        ])

        if (!sender || !channel) {
          throw new Error('Sender or channel not found')
        }

        // Get all receivers (group members except sender)
        const userGroups = await txnManager.find(UserGroup, {
          select: ['id', 'user'],
          where: {
            group: { id: payload.groupId },
            user: { id: Not(payload.senderId) },
          },
          relations: { user: true },
        })

        const receivers = userGroups.map(ug => ug.user)

        // Create message
        const message = await txnManager.save(
          txnManager.create(Message, {
            sender,
            channel,
            content: payload.content,
          }),
        )

        // Create message recipients for all receivers
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

        return { message, receivers }
      })

      // Publish SENT event to sender using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for this userId
      await this.rabbitmqService.publishToOutgoing(payload.senderId.toString(), {
        event: SocketEvents.GROUP.STATUS_SENT,
        userId: payload.senderId,
        data: {
          hash: payload.hash,
          messageId: message.id,
          groupId: payload.groupId,
          channelId: payload.channelId,
          createdAt: message.createdAt.toString(),
          status: MessageStatus.SENT,
        },
      })

      // Publish message to all receivers using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for each userId
      for (const receiver of receivers) {
        await this.rabbitmqService.publishToOutgoing(receiver.id.toString(), {
          event: SocketEvents.GROUP.MESSAGE_RECEIVE,
          userId: receiver.id,
          data: {
            messageId: message.id,
            content: payload.content,
            senderId: payload.senderId,
            groupId: payload.groupId,
            channelId: payload.channelId,
            createdAt: message.createdAt.toString(),
            status: MessageStatus.SENT,
          },
        })
      }
    } catch (error) {
      console.error('Error processing group message:', error)
      throw error
    }
  }
}
