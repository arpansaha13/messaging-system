import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { ChatEntity } from 'src/entities/chat.entity'
import { MessageEntity } from 'src/entities/message.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,

    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  /** Get the chat entity by given user-tags. (Private) */
  async #getChatEntity(
    userTag1: string,
    userTag2: string,
  ): Promise<ChatEntity> {
    const chatEntity = await this.chatRepository.findOne({
      where: { userTag1, userTag2 },
    })
    if (chatEntity === null) {
      throw new NotFoundException('No chat could be found for the given user.')
    }
    return chatEntity
  }

  /** Get the chat between user1 with user2. */
  async getChat(userTag1: string, userTag2: string): Promise<MessageEntity[]> {
    const chat = await this.#getChatEntity(userTag1, userTag2)
    // Find and return all messages (array) with this chatId
    return this.messageRepository.find({ where: { chatId: chat.chatId } })
  }

  /** Get all chat entities of given user by user-tag. */
  getAllChatsOfUser(userTag: string): Promise<ChatEntity[]> {
    return this.chatRepository.find({
      where: { userTag1: userTag },
    })
  }

  /** Get the latest message in the chat of user1 with user2 by chat id. */
  getLatestMsgByChatId(chatId: string): Promise<MessageEntity> {
    return this.messageRepository.findOne({
      where: { chatId: chatId },
      order: { time: 'DESC' },
    })
  }

  /** Get the latest message in the chat of user1 with user2 by the user-tags of both users. */
  async getLatestMsgByUserTags(
    userTag1: string,
    userTag2: string,
  ): Promise<MessageEntity> {
    const chat = await this.#getChatEntity(userTag1, userTag2)
    return this.getLatestMsgByChatId(chat.chatId)
  }
}
