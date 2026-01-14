import { MessageRepository } from '../repositories/message'
import { ChatRepository } from '../repositories/chat'

export class MessageService {
  constructor(
    private readonly repo: MessageRepository,
    private readonly chatRepo: ChatRepository,
  ) {}

  sendToUser(senderId: number, receiverId: number, content: string) {
    // ensure chats exist
    return this.repo.save(this.repo.create({ content, sender: { id: senderId }, channel: null }))
  }

  getMessagesBetween(context: any, receiverId: number, clearedAt: Date) {
    const senderId = context.user.id
    return this.repo.getMessagesByUserId(senderId, receiverId, clearedAt)
  }

  getMessagesInChannel(channelId: number) {
    return this.repo.getMessagesByChannelId(channelId)
  }
}
