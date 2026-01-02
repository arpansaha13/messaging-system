import { MessageStatus } from '@shared/constants'
import { SocketEvents } from '@shared/constants'
import AppDataSource from '../data-source'
import { MessageRecipient } from '../models/message-recipient'
import type { SocketEventPayloads } from '@shared/types'
import type { RabbitMQService } from './rabbitmq.service'

export class StatusProcessor {
  constructor(private readonly rabbitmqService: RabbitMQService) {}

  async processDelivered(payload: SocketEventPayloads.Personal.EmitDelivered): Promise<void> {
    try {
      await AppDataSource.manager.update(
        MessageRecipient,
        { message: { id: payload.messageId }, receiver: { id: payload.receiverId } },
        { status: MessageStatus.DELIVERED },
      )

      // Publish DELIVERED event to sender using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for this userId
      await this.rabbitmqService.publishToOutgoing(payload.senderId.toString(), {
        event: SocketEvents.PERSONAL.STATUS_DELIVERED,
        userId: payload.senderId,
        data: {
          messageId: payload.messageId,
          receiverId: payload.receiverId,
          status: MessageStatus.DELIVERED,
        },
      })
    } catch (error) {
      console.error('Error processing delivered status:', error)
      throw error
    }
  }

  async processRead(
    payload: SocketEventPayloads.Personal.EmitRead | SocketEventPayloads.Personal.EmitRead[],
  ): Promise<void> {
    try {
      const payloadArray = Array.isArray(payload) ? payload : [payload]
      const messageIds = payloadArray.map(p => p.messageId)

      // Update message status to READ
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

      // Publish READ event to sender using userId as routing key
      // RabbitMQ will route to the server queue that has a binding for this userId
      const senderId = payloadArray[0].senderId
      const readPayloadToSender = payloadArray.map(p => ({
        messageId: p.messageId,
        receiverId: p.receiverId,
        status: MessageStatus.READ,
      }))

      await this.rabbitmqService.publishToOutgoing(senderId.toString(), {
        event: SocketEvents.PERSONAL.STATUS_READ,
        userId: senderId,
        data: readPayloadToSender,
      })
    } catch (error) {
      console.error('Error processing read status:', error)
      throw error
    }
  }
}
