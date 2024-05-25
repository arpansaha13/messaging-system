import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { MessageRecipient } from './message-recipient.entity'

@Injectable()
export class MessageRecipientRepository extends Repository<MessageRecipient> {
  constructor(private dataSource: DataSource) {
    super(MessageRecipient, dataSource.createEntityManager())
  }
}
