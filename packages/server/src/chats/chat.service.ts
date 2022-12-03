import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { ChatEntity } from './chat.entity'
import { MessageEntity, MessageStatus } from './message.entity'
// Types
import type { Repository } from 'typeorm'
import type { Ws1to1MessageDto } from './dtos/chatGateway.dto'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,

    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both chat participants cannot have the same user_id.')
  }

  /**
   * Get the chat entity by given chat_id.
   * @param chatId
   * @param ignoreException If the client requests for a non-existing chat, then a `NotFoundException` will be thrown. Set this value to `true` to ignore the exception.
   */
  async getChatEntityByChatId(chatId: number, ignoreException = false): Promise<ChatEntity> {
    const chatEntity = await this.chatRepository.findOne({
      where: { id: chatId },
    })
    if (!ignoreException && chatEntity === null) {
      throw new NotFoundException('No chat could be found for the given users.')
    }
    return chatEntity
  }

  /**
   * Get the chat entity by given user_id.
   * @param userId1
   * @param userId2
   * @param ignoreException If the client requests for a non-existing chat, then a `NotFoundException` will be thrown. Set this value to `true` to ignore the exception.
   */
  async getChatEntityByUserId(userId1: number, userId2: number, ignoreException = false): Promise<ChatEntity> {
    if (userId1 === userId2) this.#sameParticipantError()
    const chatEntity = await this.chatRepository.findOneBy([
      {
        participant_1: userId1,
        participant_2: userId2,
      },
      {
        participant_2: userId1,
        participant_1: userId2,
      },
    ])
    if (!ignoreException && chatEntity === null) {
      throw new NotFoundException('No chat could be found for the given users.')
    }
    return chatEntity
  }

  /** Get all messages with chat_id. */
  async getChatByChatId(chatId: number): Promise<MessageEntity[]> {
    const chat = await this.getChatEntityByChatId(chatId)
    return this.messageRepository.find({ where: { chatId: chat.id } })
  }

  /** Get all messages with user_id. */
  async getChatByUserId(userId1: number, userId2: number): Promise<MessageEntity[]> {
    const chat = await this.getChatEntityByUserId(userId1, userId2)
    return this.messageRepository.find({ where: { chatId: chat.id } })
  }

  /** Get all chat entities of given user by user_id. */
  getAllChatEntitiesOfUser(userId: number): Promise<ChatEntity[]> {
    return this.chatRepository.findBy([{ participant_1: userId }, { participant_2: userId }])
  }

  /** Get the latest message in the chat by chat_id. */
  getLatestMsgByChatId(chatId: number): Promise<MessageEntity> {
    return this.messageRepository.findOne({
      where: { chatId },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Create one-to-one chat entity.
   * @returns the chat_id of the newly created chat entity.
   */
  async create1to1Chat(firstMsg: Ws1to1MessageDto): Promise<number> {
    if (firstMsg.senderId === firstMsg.receiverId) this.#sameParticipantError()

    const userId1 = firstMsg.senderId
    const userId2 = firstMsg.receiverId

    const chatInsertRes = await this.chatRepository.insert({
      participant_1: userId1,
      participant_2: userId2,
      firstMsgTstamp: {
        [userId1]: firstMsg.ISOtime,
        [userId2]: firstMsg.ISOtime,
      },
      isMuted: {
        [userId1]: false,
        [userId2]: false,
      },
      archived: {
        [userId1]: false,
        [userId2]: false,
      },
      deleted: {
        [userId1]: false,
        [userId2]: false,
      },
    })
    return chatInsertRes.identifiers[0].id as number
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

  updateMsgStatus(msgId: number, newStatus: MessageStatus.DELIVERED | MessageStatus.READ) {
    return this.messageRepository.update(msgId, { status: newStatus })
  }
}
