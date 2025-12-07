import { MessageRepository } from '../repositories/message.repository'
import { ChatRepository } from '../repositories/chat.repository'

export class MessageService {
  constructor(
    private repo: MessageRepository,
    private chatRepo: ChatRepository,
  ) {}

  sendToUser(senderId: number, receiverId: number, content: string) {
    // ensure chats exist
    return this.repo.saveMessage({ content, sender: { id: senderId } as any, channel: null })
  }

  getMessagesBetween(senderId: number, receiverId: number, clearedAt: Date) {
    return this.repo.getMessagesByUserId(senderId, receiverId, clearedAt)
  }

  getMessagesInChannel(channelId: number) {
    return this.repo.getMessagesByChannelId(channelId)
  }
}
