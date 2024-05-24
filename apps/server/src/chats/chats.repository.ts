import { Injectable } from '@nestjs/common'
import { Repository, DataSource, type FindOptionsWhere, type UpdateResult } from 'typeorm'
import { Chat } from './chats.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class ChatRepository extends Repository<Chat> {
  constructor(private dataSource: DataSource) {
    super(Chat, dataSource.createEntityManager())
  }

  async getFirstMsgTstampBy(where: FindOptionsWhere<Chat> | FindOptionsWhere<Chat>[]) {
    const chat = await this.createQueryBuilder('chat').select('chat.clearedAt').where(where).getOne()
    return chat.clearedAt
  }

  updateChatOptions(senderId: User['id'], receiverId: User['id'], partialEntity: Partial<Chat>): Promise<UpdateResult> {
    return this.update(
      {
        sender: { id: senderId },
        receiver: { id: receiverId },
      },
      partialEntity,
    )
  }
}
