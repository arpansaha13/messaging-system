import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { MessageRepository } from './message.repository'
import { ChatRepository } from 'src/chats/chats.repository'
import type { Message } from './message.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,

    @InjectRepository(MessageRepository)
    private messageRepository: MessageRepository,
  ) {}

  async getMessagesByUserId(authUser: User, receiverId: User['id']): Promise<Message[]> {
    const chat = await this.chatRepository.findOne({
      where: { sender_id: authUser.id, receiver_id: receiverId },
    })

    if (isNullOrUndefined(chat)) return []

    return this.messageRepository.getMessagesByUserId(authUser.id, receiverId, chat.clearedAt)
  }
}
