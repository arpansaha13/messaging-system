import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Not } from 'typeorm'
// Entities
import { ChatEntity } from './chat.entity'
import { MessageEntity, MessageStatus } from './message.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both chat participants cannot have the same user_id.')
  }

  /**
   * Update status of **all received** messages from SENT to DELIVERED.
   * This should be done whenever a user comes online.
   * @param authUserId user_id of authorized user
   * @param chatEntities All chat entities of given user
   */
  // TODO: Update msg status when receiver comes online while sender is already online (real-time)
  updateDeliveredStatus(authUserId: number, chatEntities: ChatEntity[]) {
    return this.messageRepository.update(
      {
        chatId: In(chatEntities.map(entity => entity.id)),
        senderId: Not(authUserId), // Those messages where this user is not the sender, i.e receiver.
        status: MessageStatus.SENT,
      },
      {
        status: MessageStatus.DELIVERED,
      },
    )
  }

  /** Get all messages with chat_id. */
  getMessagesByChatId(chatId: number): Promise<MessageEntity[]> {
    return this.messageRepository.find({ where: { chatId }, order: { createdAt: 'ASC' } })
  }

  /** Get the latest message in the chat by chat_id. */
  getLatestMsgByChatId(chatId: number): Promise<MessageEntity> {
    return this.messageRepository.findOne({
      where: { chatId },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Create one-to-one chat message.
   * @returns the msg_id of the newly created chat message.
   */
  async create1to1ChatMsg(chatId: number, senderId: number, receiverId: number, content: string) {
    if (senderId === receiverId) this.#sameParticipantError()
    const msgInsertRes = await this.messageRepository.insert({
      chatId,
      content,
      senderId,
      status: MessageStatus.SENT,
      deletedBy: {
        [senderId]: false,
        [receiverId]: false,
      },
    })
    return msgInsertRes.identifiers[0].id as number
  }

  /** Update status of a single message to DELIVERED or READ. */
  updateMsgStatus(msgId: number, newStatus: MessageStatus.DELIVERED | MessageStatus.READ) {
    return this.messageRepository.update(msgId, { status: newStatus })
  }
}
