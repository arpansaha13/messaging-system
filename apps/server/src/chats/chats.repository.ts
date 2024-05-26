import { Injectable } from '@nestjs/common'
import { Repository, DataSource, type FindOptionsWhere, type UpdateResult } from 'typeorm'
import { Chat } from './chats.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class ChatRepository extends Repository<Chat> {
  constructor(private dataSource: DataSource) {
    super(Chat, dataSource.createEntityManager())
  }

  getChatsOfUser(userId: User['id']) {
    return this.createQueryBuilder('chat')
      .where('chat.sender.id = :userId', { userId })
      .select('chat.id', 'id')
      .addSelect('chat.muted', 'muted')
      .addSelect('chat.pinned', 'pinned')
      .addSelect('chat.archived', 'archived')
      .addSelect('chat.clearedAt', 'clearedAt')
      .addSelect('receiver.id')
      .addSelect('receiver.globalName')
      .addSelect('receiver.dp')
      .addSelect('receiver.username')
      .innerJoin('chat.receiver', 'receiver')
      .getRawMany()
  }

  getChatOfUserByReceiverId(userId: User['id'], receiverId: User['id']) {
    return this.createQueryBuilder('chat')
      .where('chat.sender.id = :userId', { userId })
      .andWhere('chat.receiver.id = :receiverId', { receiverId })
      .select('chat.id', 'id')
      .addSelect('chat.muted', 'muted')
      .addSelect('chat.pinned', 'pinned')
      .addSelect('chat.archived', 'archived')
      .addSelect('chat.clearedAt', 'clearedAt')
      .addSelect('receiver.id')
      .addSelect('receiver.globalName')
      .addSelect('receiver.dp')
      .addSelect('receiver.username')
      .innerJoin('chat.receiver', 'receiver')
      .getRawOne()
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
