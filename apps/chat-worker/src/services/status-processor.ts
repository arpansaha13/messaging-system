import { MessageStatus } from '@shared/constants'
import { SocketEvents } from '@shared/constants'
import AppDataSource from '../data-source'
import { MessageRecipient } from '../models/message-recipient'
import type { SocketEventPayloads } from '@shared/types'
import type { RabbitMQService } from './rabbitmq.service'
import type { MemcachedService } from './memcached.service'

export class StatusProcessor {
  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly memcachedService: MemcachedService,
  ) {}

  async processDelivered(payload: SocketEventPayloads.Personal.EmitDelivered): Promise<void> {
    try {
      await AppDataSource.manager.update(
        MessageRecipient,
        { message: { id: payload.messageId }, receiver: { id: payload.receiverId } },
        { status: MessageStatus.DELIVERED },
      )

      // Get sender's server ID
      const senderServerId = await this.memcachedService.getUserServerMapping(payload.senderId)

      // Publish DELIVERED event to sender
      if (senderServerId) {
        await this.rabbitmqService.publishToOutgoing(senderServerId, {
          event: SocketEvents.PERSONAL.STATUS_DELIVERED,
          userId: payload.senderId,
          data: {
            messageId: payload.messageId,
            receiverId: payload.receiverId,
            status: MessageStatus.DELIVERED,
          },
        })
      }
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

      // Get sender's server ID
      const senderId = payloadArray[0].senderId
      const senderServerId = await this.memcachedService.getUserServerMapping(senderId)

      // Publish READ event to sender
      if (senderServerId) {
        const readPayloadToSender = payloadArray.map(p => ({
          messageId: p.messageId,
          receiverId: p.receiverId,
          status: MessageStatus.READ,
        }))

        await this.rabbitmqService.publishToOutgoing(senderServerId, {
          event: SocketEvents.PERSONAL.STATUS_READ,
          userId: senderId,
          data: readPayloadToSender,
        })
      }
    } catch (error) {
      console.error('Error processing read status:', error)
      throw error
    }
  }
}
