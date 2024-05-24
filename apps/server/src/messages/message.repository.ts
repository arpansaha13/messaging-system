import { Injectable } from '@nestjs/common'
import { Brackets, DataSource, Repository } from 'typeorm'
import { Message } from './message.entity'
import { Chat } from 'src/chats/chats.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private dataSource: DataSource) {
    super(Message, dataSource.createEntityManager())
  }

  getMessagesByUserId(senderId: User['id'], receiverId: User['id'], clearedAt: Chat['firstMsgTstamp']) {
    return this.createQueryBuilder('message')
      .select('message.id', 'id')
      .addSelect('message.content', 'content')
      .addSelect('message.sender.id', 'senderId')
      .addSelect('message.createdAt', 'createdAt')
      .addSelect('recipient.status', 'status')
      .innerJoin('message.recipients', 'recipient')
      .innerJoin('recipient.receiver', 'receiver')
      .where('message.createdAt >= :clearedAt', { clearedAt })
      .andWhere(
        new Brackets(qb => {
          qb.where(
            new Brackets(qb => {
              // prettier-ignore
              qb.where('message.sender.id = :senderId', { senderId })
                .andWhere('recipient.receiver.id = :receiverId', { receiverId })
            }),
          ).orWhere(
            new Brackets(qb => {
              // prettier-ignore
              qb.where('message.sender.id = :receiverId', { receiverId })
                .andWhere('recipient.receiver.id = :senderId', { senderId })
            }),
          )
        }),
      )
      .orderBy('message.createdAt', 'DESC') // latest message
      .getRawMany()
  }

  getLatestMessageByUserId(senderId: User['id'], receiverId: User['id'], clearedAt: Chat['firstMsgTstamp']) {
    return this.createQueryBuilder('message')
      .select('message.id', 'id')
      .addSelect('message.content', 'content')
      .addSelect('message.sender.id', 'senderId')
      .addSelect('message.createdAt', 'createdAt')
      .addSelect('recipient.status', 'status')
      .addSelect('receiver.id')
      .innerJoin('message.recipients', 'recipient')
      .innerJoin('recipient.receiver', 'receiver')
      .where('message.createdAt >= :clearedAt', { clearedAt })
      .andWhere(
        new Brackets(qb => {
          qb.where(
            new Brackets(qb => {
              // prettier-ignore
              qb.where('message.sender.id = :senderId', { senderId })
                .andWhere('recipient.receiver.id = :receiverId', { receiverId })
            }),
          ).orWhere(
            new Brackets(qb => {
              // prettier-ignore
              qb.where('message.sender.id = :receiverId', { receiverId })
                .andWhere('recipient.receiver.id = :senderId', { senderId })
            }),
          )
        }),
      )
      .orderBy('message.createdAt', 'DESC') // latest message
      .limit(1)
      .getRawOne()
  }
}
