import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { Message } from './message.entity'

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private dataSource: DataSource) {
    super(Message, dataSource.createEntityManager())
  }
}
