import { Injectable } from '@nestjs/common'
import { Repository, DataSource, type FindOptionsWhere, type UpdateResult } from 'typeorm'
import { Chat } from './chats.entity'

@Injectable()
export class ChatRepository extends Repository<Chat> {
  constructor(private dataSource: DataSource) {
    super(Chat, dataSource.createEntityManager())
  }
}
