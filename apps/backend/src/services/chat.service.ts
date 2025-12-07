import { ChatRepository } from '../repositories/chat.repository'
import { ContactRepository } from '../repositories/contact.repository'
import { MessageRepository } from '../repositories/message.repository'

const isNullOrUndefined = (v: any) => v === null || v === undefined

export class ChatService {
  constructor(
    private repo: ChatRepository,
    private contactRepo: ContactRepository,
    private messageRepo: MessageRepository,
  ) {}

  async getChatsOfUser(userId: number) {
    const chats = await this.repo.getChatsOfUser(userId)

    const promises: Array<Promise<any>> = []
    for (const chat of chats) {
      promises.push(this.messageRepo.getLatestMessageByUserId(userId, chat.receiver_id, chat.clearedAt))
    }

    const receiverIds = chats.map((c: any) => c.receiver_id)
    const messages = await Promise.all(promises)
    const contacts = await this.contactRepo.getContactsHavingUserIds(userId, receiverIds)

    const contactsMap = new Map<number, any>()
    contacts.forEach((contact: any) => {
      contactsMap.set(contact.userIdInContact, { id: contact.id, alias: contact.alias })
    })

    const res: any = { unarchived: [], archived: [] }

    chats.forEach((chat: any) => {
      const message = messages.find((message: any) => {
        if (isNullOrUndefined(message)) return null

        const messageParticipants = [message.receiver_id, message.senderId].sort()
        const chatParticipants = [chat.receiver_id, userId].sort()

        const isSame =
          messageParticipants.length === chatParticipants.length &&
          messageParticipants.every((el: any, i: number) => el === chatParticipants[i])

        return isSame
      })

      const contact = contactsMap.get(chat.receiver_id) ?? null

      const item = { chat, message, contact }

      if (item.chat.archived) res.archived.push(item)
      else res.unarchived.push(item)
    })

    const compareFn = (a: any, b: any) => {
      // Pinned chats on top
      if (a.chat.pinned && !b.chat.pinned) return -1
      if (!a.chat.pinned && b.chat.pinned) return 1

      // Cleared convo's at bottom
      if (isNullOrUndefined(a.message) && isNullOrUndefined(b.message)) return 0
      if (isNullOrUndefined(b.message)) return -1
      if (isNullOrUndefined(a.message)) return 1

      // Latest convo on top
      if (new Date(a.message!.createdAt) > new Date(b.message!.createdAt)) return -1
      if (new Date(a.message!.createdAt) < new Date(b.message!.createdAt)) return 1
      return 0
    }

    res.unarchived.sort(compareFn)
    res.archived.sort(compareFn)

    return res
  }

  async getChatOfUserWithReceiver(userId: number, receiverId: number) {
    const chat = await this.repo.getChatOfUserByReceiverId(userId, receiverId)

    if (isNullOrUndefined(chat)) {
      return null
    }

    const message = await this.messageRepo.getLatestMessageByUserId(userId, chat.receiver_id, chat.clearedAt)
    const contact = await this.contactRepo.getContactsHavingUserIds(userId, receiverId)

    return { chat, message, contact }
  }

  async updateArchive(senderId: number, receiverId: number, newValue: boolean) {
    await this.repo.updateChatOptions(senderId, receiverId, { archived: newValue, pinned: false })
  }

  async updatePin(senderId: number, receiverId: number, newValue: boolean) {
    await this.repo.updateChatOptions(senderId, receiverId, { pinned: newValue })
  }

  async clearChat(senderId: number, receiverId: number) {
    await this.repo.updateChatOptions(senderId, receiverId, { clearedAt: new Date() })
  }

  async deleteChat(senderId: number, receiverId: number) {
    return this.repo.delete({ sender_id: senderId, receiver_id: receiverId } as any)
  }

  async getChat(senderId: number, receiverId: number) {
    const chat = await this.repo.findChat(senderId, receiverId)
    return chat
  }

  async ensureChatExists(senderId: number, receiverId: number) {
    let chat = await this.repo.findChat(senderId, receiverId)
    if (!chat)
      chat = (
        await this.repo.saveChat({
          sender_id: senderId,
          receiver_id: receiverId,
          clearedAt: new Date(),
          muted: false,
          archived: false,
          pinned: false,
        })
      )[0]
    return chat
  }
}
