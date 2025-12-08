import { type DataSource, Repository } from 'typeorm'
import { Chat } from '../models/chat.entity'

export class ChatRepository extends Repository<Chat> {
  constructor(dataSource: DataSource) {
    super(Chat, dataSource.createEntityManager())
  }

  getChatsOfUser(userId: number) {
    return this.createQueryBuilder('chat')
      .where('chat.sender_id = :userId', { userId })
      .select('chat.muted', 'muted')
      .addSelect('chat.pinned', 'pinned')
      .addSelect('chat.archived', 'archived')
      .addSelect('chat.clearedAt', 'clearedAt')
      .addSelect('receiver.id')
      .addSelect('receiver.dp')
      .addSelect('receiver.bio')
      .addSelect('receiver.username')
      .addSelect('receiver.globalName')
      .innerJoin('chat.receiver_id', 'receiver')
      .getRawMany()
  }

  getChatOfUserByReceiverId(userId: number, receiverId: number) {
    return this.createQueryBuilder('chat')
      .where('chat.sender_id = :userId', { userId })
      .andWhere('chat.receiver_id = :receiverId', { receiverId })
      .select('chat.muted', 'muted')
      .addSelect('chat.pinned', 'pinned')
      .addSelect('chat.archived', 'archived')
      .addSelect('chat.clearedAt', 'clearedAt')
      .addSelect('receiver.id')
      .addSelect('receiver.dp')
      .addSelect('receiver.bio')
      .addSelect('receiver.username')
      .addSelect('receiver.globalName')
      .innerJoin('chat.receiver_id', 'receiver')
      .getRawOne()
  }

  updateChatOptions(sender_id: number, receiver_id: number, partialEntity: Partial<Chat>) {
    return this.update({ sender_id, receiver_id } as any, partialEntity)
  }

  findChat(senderId: number, receiverId: number) {
    return this.findOne({ where: { sender_id: senderId, receiver_id: receiverId } as any })
  }

  saveChat(chat: Partial<Chat>) {
    const e = this.create(chat as any)
    return this.save(e)
  }
}
