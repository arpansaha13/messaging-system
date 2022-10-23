import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { ChatEntity } from 'src/chats/chat.entity'
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

  /** Get the chat entity by given user_id's. (Private) */
  async #getChatEntity(
    auth_user_id: number,
    sec_person: number,
  ): Promise<ChatEntity> {
    const chatEntity = await this.chatRepository.findOne({
      where: { user: auth_user_id, sec_person },
    })
    if (chatEntity === null) {
      throw new NotFoundException('No chat could be found for the given user.')
    }
    return chatEntity
  }

  /** Get the chat of auth_user with sec_person. */
  async getChat(
    auth_user_id: number,
    sec_person: number,
  ): Promise<MessageEntity[]> {
    const chat = await this.#getChatEntity(auth_user_id, sec_person)
    // Find and return all messages (array) with this chat_id
    return this.messageRepository.find({ where: { chat_id: chat.id } })
  }

  /** Get all chat entities of given user by user_id. */
  getAllChatsOfUser(user_id: number): Promise<ChatEntity[]> {
    return this.chatRepository.find({
      where: { user: user_id },
    })
  }

  /** Get the latest message in the chat of user1 with user2 (sec_person) by chat_id. */
  getLatestMsgByChatId(chat_id: number): Promise<MessageEntity> {
    return this.messageRepository.findOne({
      where: { chat_id },
      order: { created_at: 'DESC' },
    })
  }

  /** Get the latest message in the chat of user1 with user2 (sec_person) by the id of both users. */
  async getLatestMsgByUserIds(
    user: number,
    sec_person: number,
  ): Promise<MessageEntity> {
    const chat = await this.#getChatEntity(user, sec_person)
    return this.getLatestMsgByChatId(chat.id)
  }
}
