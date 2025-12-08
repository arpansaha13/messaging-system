import { type DataSource, Brackets, Repository } from 'typeorm'
import { Message } from '../models/message.entity'

export class MessageRepository extends Repository<Message> {
  constructor(dataSource: DataSource) {
    super(Message, dataSource.createEntityManager())
  }

  getMessagesByUserId(senderId: number, receiverId: number, clearedAt: Date) {
    return this.createQueryBuilder('message')
      .select('message.id', 'id')
      .addSelect('message.content', 'content')
      .addSelect('message.sender.id', 'senderId')
      .addSelect('message.createdAt', 'createdAt')
      .addSelect('recipient.status', 'status')
      .innerJoin('message.recipients', 'recipient')
      .innerJoin('recipient.receiver', 'receiver')
      .where('message.createdAt >= :clearedAt', { clearedAt })
      .andWhere('message.channel_id is null')
      .andWhere(
        new Brackets(qb => {
          qb.where(
            new Brackets(qb2 => {
              qb2
                .where('message.sender.id = :senderId', { senderId })
                .andWhere('recipient.receiver.id = :receiverId', { receiverId })
            }),
          ).orWhere(
            new Brackets(qb3 => {
              qb3
                .where('message.sender.id = :receiverId', { receiverId })
                .andWhere('recipient.receiver.id = :senderId', { senderId })
            }),
          )
        }),
      )
      .orderBy('message.createdAt')
      .getRawMany()
  }

  getMessagesByChannelId(channelId: number) {
    return this.createQueryBuilder('message')
      .select('message.id', 'id')
      .addSelect('message.content', 'content')
      .addSelect('message.sender.id', 'senderId')
      .addSelect('message.createdAt', 'createdAt')
      .where('message.channel_id = :channelId', { channelId })
      .orderBy('message.createdAt')
      .getRawMany()
  }

  getLatestMessageByUserId(senderId: number, receiverId: number, clearedAt: Date) {
    return this.createQueryBuilder('message')
      .select('message.id', 'id')
      .addSelect('message.content', 'content')
      .addSelect('message.sender.id', 'senderId')
      .addSelect('message.createdAt', 'createdAt')
      .addSelect('recipient.status', 'status')
      .addSelect('receiver.id', 'receiver_id')
      .innerJoin('message.recipients', 'recipient')
      .innerJoin('recipient.receiver', 'receiver')
      .where('message.createdAt >= :clearedAt', { clearedAt })
      .andWhere('message.channel_id is null')
      .andWhere(
        new Brackets(qb => {
          qb.where(
            new Brackets(qb2 => {
              qb2
                .where('message.sender.id = :senderId', { senderId })
                .andWhere('recipient.receiver.id = :receiverId', { receiverId })
            }),
          ).orWhere(
            new Brackets(qb3 => {
              qb3
                .where('message.sender.id = :receiverId', { receiverId })
                .andWhere('recipient.receiver.id = :senderId', { senderId })
            }),
          )
        }),
      )
      .orderBy('message.createdAt', 'DESC')
      .limit(1)
      .getRawOne()
  }

  saveMessage(msg: Partial<Message>) {
    const e = this.create(msg)
    return this.save(e)
  }
}
