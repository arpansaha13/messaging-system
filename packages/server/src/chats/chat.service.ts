import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { ChatEntity } from './chat.entity'
// Types
import type { Repository } from 'typeorm'
import type { Ws1to1MessageDto } from './dtos/chatGateway.dto'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both chat participants cannot have the same user_id.')
  }
  #chatNotFound() {
    throw new NotFoundException('No chat could be found for the given users.')
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
    if (!ignoreException && chatEntity === null) this.#chatNotFound()
    return chatEntity
  }

  /**
   * Get the chat entity by given user_ids.
   * @param userId1
   * @param userId2
   * @param ignoreException If the client requests for a non-existing chat, then a `NotFoundException` will be thrown. Set this value to `true` to ignore the exception.
   */
  async getChatEntityByUserIds(userId1: number, userId2: number, ignoreException = false): Promise<ChatEntity> {
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
    if (!ignoreException && chatEntity === null) this.#chatNotFound()
    return chatEntity
  }

  /** Get all chat entities of by given user_id. */
  getAllChatEntitiesOfUser(userId: number): Promise<ChatEntity[]> {
    return this.chatRepository.findBy([{ participant_1: userId }, { participant_2: userId }])
  }

  /**
   * Create one-to-one chat entity.
   * @param firstMsg The first message of this chat received through web-sockets.
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
}
