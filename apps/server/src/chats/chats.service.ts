import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { ChatRepository } from './chats.repository'
import { ContactRepository } from 'src/contacts/contact.repository'
import { MessageRepository } from 'src/messages/message.repository'
import type { User } from 'src/users/user.entity'

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatRepository)
    private readonly chatRepository: ChatRepository,

    @InjectRepository(ContactRepository)
    private readonly contactRepository: ContactRepository,

    @InjectRepository(MessageRepository)
    private readonly messageRepository: MessageRepository,
  ) {}

  async getChatsOfUser(userId: User['id']): Promise<any> {
    const chats = await this.chatRepository.getChatsOfUser(userId)

    const promises = []

    for (const chat of chats) {
      promises.push(this.messageRepository.getLatestMessageByUserId(userId, chat.receiver_id, chat.clearedAt))
    }

    const receiverIds = chats.map(chat => chat.receiver_id)

    const messages = await Promise.all(promises)

    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.alias', 'alias')
      .addSelect('userInContact.id', 'userIdInContact')
      .addSelect('userInContact.id', 'userIdInContact')
      .innerJoin('contact.userInContact', 'userInContact')
      .where('contact.user.id = :userId', { userId })
      .andWhere('contact.userInContact.id IN (:...receiverIds)', { receiverIds })
      .getRawMany()

    const contactsMap = new Map()
    contacts.forEach(contact => {
      contactsMap.set(contact.userIdInContact, contact)
    })

    const res = { unarchived: [], archived: [] }

    chats.forEach(chat => {
      const message = messages.find(message => {
        if (isNullOrUndefined(message)) return null

        const messageParticipants = [message.receiver_id, message.senderId].sort()
        const chatParticipants = [chat.receiver_id, userId].sort()

        const isSame =
          messageParticipants.length === chatParticipants.length &&
          messageParticipants.every((el, i) => el === chatParticipants[i])

        return isSame
      })

      const contact = contactsMap.get(chat.receiver_id) ?? null

      const item = createChatListItem(chat, message, contact)

      if (item.chat.archived) res.archived.push(item)
      else res.unarchived.push(item)
    })

    const compareFn = (a: any, b: any) => {
      // Pinned chats on top
      if (a.chat.pinned && !b.chat.pinned) return -1
      if (!a.chat.pinned && b.chat.pinned) return 1

      // Cleared convo's at bottom
      if (a.latestMsg !== null && b.latestMsg === null) return -1
      if (a.latestMsg === null && b.latestMsg !== null) return 1
      if (a.latestMsg === null && b.latestMsg === null) return 0

      // Latest convo on top
      if (new Date(a.latestMsg!.createdAt) > new Date(b.latestMsg!.createdAt)) return -1
      if (new Date(a.latestMsg!.createdAt) < new Date(b.latestMsg!.createdAt)) return 1
      return 0
    }

    res.unarchived.sort(compareFn)
    res.archived.sort(compareFn)

    return res
  }

  async getChatOfUserWithReceiver(userId: User['id'], receiverId: User['id']) {
    const chat = await this.chatRepository.getChatOfUserByReceiverId(userId, receiverId)

    if (isNullOrUndefined(chat)) {
      return null
    }

    const message = await this.messageRepository.getLatestMessageByUserId(userId, chat.receiver_id, chat.clearedAt)

    const contact = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.alias', 'alias')
      .addSelect('userInContact.id', 'userIdInContact')
      .addSelect('userInContact.id', 'userIdInContact')
      .innerJoin('contact.userInContact', 'userInContact')
      .where('contact.user.id = :userId', { userId })
      .andWhere('contact.userInContact.id = :receiverId', { receiverId })
      .getRawOne()

    return createChatListItem(chat, message, contact)
  }

  async clearChat(authUserId: User['id'], receiverId: User['id']): Promise<void> {
    await this.chatRepository.updateChatOptions(authUserId, receiverId, { clearedAt: new Date() })
  }

  async deleteChat(authUserId: User['id'], receiverId: User['id']): Promise<void> {
    await this.chatRepository.delete({ sender: { id: authUserId }, receiver: { id: receiverId } })
  }

  async updatePin(authUserId: User['id'], receiverId: User['id'], newValue: boolean): Promise<void> {
    await this.chatRepository.updateChatOptions(authUserId, receiverId, { pinned: newValue })
  }

  async updateArchive(authUserId: User['id'], receiverId: User['id'], newValue: boolean): Promise<void> {
    await this.chatRepository.updateChatOptions(authUserId, receiverId, { archived: newValue, pinned: false })
  }
}

function createChatListItem(chat: any, message: any | null, contact: any | null) {
  return {
    contact: contact
      ? {
          id: contact.id,
          alias: contact.alias,
        }
      : null,
    latestMsg: message
      ? {
          id: message.id,
          status: message.status,
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt,
        }
      : null,
    receiver: {
      id: chat.receiver_id,
      dp: chat.receiver_dp,
      username: chat.receiver_username,
      globalName: chat.receiver_global_name,
    },
    chat: {
      id: chat.id,
      muted: chat.muted,
      pinned: chat.pinned,
      archived: chat.archived,
    },
  }
}
