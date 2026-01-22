import { MessageRepository } from '../repositories/message'
import type { RabbitMQService } from './rabbitmq'
import type { SendPersonalMessageDto, HandleDeliveredDto, HandleReadDto, SendGroupMessageDto } from '../dto/message'

export class MessageService {
  constructor(
    private readonly repo: MessageRepository,
    private readonly rabbitmqService: RabbitMQService,
  ) {}

  sendToUser(senderId: number, receiverId: number, content: string) {
    // ensure chats exist
    return this.repo.save(this.repo.create({ content, sender: { id: senderId }, channel: null }))
  }

  getMessagesBetween(context: any, receiverId: number, clearedAt: Date) {
    const senderId = context.user.id
    return this.repo.getMessagesByUserId(senderId, receiverId, clearedAt)
  }

  getMessagesInChannel(channelId: number) {
    return this.repo.getMessagesByChannelId(channelId)
  }

  async sendPersonalMessage(context: any, dto: SendPersonalMessageDto) {
    const senderId = context.user.id

    // Basic validation
    if (!dto.content || !dto.receiverId || !dto.hash) {
      throw new Error('Invalid message payload')
    }

    // Publish to incoming_messages exchange for worker to process
    await this.rabbitmqService.publishToIncoming('personal.message', {
      type: 'MESSAGE_SEND',
      payload: {
        senderId,
        receiverId: dto.receiverId,
        content: dto.content,
        hash: dto.hash,
      },
    })

    return { success: true }
  }

  async sendGroupMessage(context: any, dto: SendGroupMessageDto) {
    const senderId = context.user.id

    // Basic validation
    if (!dto.content || !dto.groupId || !dto.channelId || !dto.hash) {
      throw new Error('Invalid group message payload')
    }

    // Publish to incoming_messages exchange for worker to process
    await this.rabbitmqService.publishToIncoming('group.message', {
      type: 'MESSAGE_SEND',
      payload: {
        senderId,
        groupId: dto.groupId,
        channelId: dto.channelId,
        content: dto.content,
        hash: dto.hash,
      },
    })

    return { success: true }
  }

  async handleDelivered(context: any, dto: HandleDeliveredDto) {
    const receiverId = context.user.id

    // Basic validation
    if (!dto.messageId || !dto.receiverId || !dto.senderId) {
      throw new Error('Invalid delivered payload')
    }

    // Publish to incoming_messages exchange for worker to process
    await this.rabbitmqService.publishToIncoming('personal.delivered', {
      type: 'STATUS_DELIVERED',
      payload: {
        messageId: dto.messageId,
        receiverId,
        senderId: Number(dto.senderId),
      },
    })

    return { success: true }
  }

  async handleRead(context: any, payloads: HandleReadDto[]) {
    const receiverId = context.user.id

    // Basic validation
    if (!Array.isArray(payloads) || payloads.length === 0) {
      throw new Error('Invalid read payload')
    }

    // Publish to incoming_messages exchange for worker to process
    await this.rabbitmqService.publishToIncoming('personal.read', {
      type: 'STATUS_READ',
      payload: payloads.map(p => ({
        messageId: p.messageId,
        senderId: p.senderId,
        receiverId,
      })),
    })

    return { success: true }
  }
}
