import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets } from 'typeorm'
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

  async getChats(userId: User['id']): Promise<any> {
    const chats = await this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.sender.id = :userId', { userId })
      .select('chat.receiver.id', 'receiverId')
      .addSelect('chat.id', 'id')
      .addSelect('chat.muted', 'muted')
      .addSelect('chat.pinned', 'pinned')
      .addSelect('chat.archived', 'archived')
      .getRawMany()

    const receiverIds = chats.map(chat => chat.receiverId)

    if (receiverIds.length === 0) {
      return []
    }

    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.id', 'id')
      .addSelect('message.content', 'content')
      .addSelect('message.sender.id', 'senderId')
      .addSelect('message.createdAt', 'createdAt')
      .addSelect('recipient.status', 'status')
      .addSelect('receiver.id')
      .addSelect('receiver.globalName')
      .addSelect('receiver.dp')
      .addSelect('receiver.username')
      .innerJoin('message.recipients', 'recipient')
      .innerJoin('recipient.receiver', 'receiver')
      .where(
        new Brackets(qb => {
          // prettier-ignore
          qb.where('message.sender.id = :userId', { userId })
            .andWhere('recipient.receiver.id IN (:...receiverIds)', { receiverIds })
        }),
      )
      .orWhere(
        new Brackets(qb => {
          // prettier-ignore
          qb.where('message.sender.id IN (:...receiverIds)', { receiverIds })
            .andWhere('recipient.receiver.id = :userId', { userId })
        }),
      )
      .orderBy('receiver.id', 'ASC') // needed for DISTINCT ON
      .addOrderBy('message.createdAt', 'DESC') // latest message
      .distinctOn(['receiver.id']) // take only the latest message for each unique receiver
      .getRawMany()

    messages.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.alias', 'alias')
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

    // The messages query finds the latest message per user and not per conversation
    // Hence it adds one extra record in any one chat, i.e. the latest msg of the sender
    // irrespective of whether it is the latest msg of the chat or not.
    // Filter out the extra record.
    const chatIsTaken = new Set()

    messages.forEach(message => {
      const { receiverId: _, ...chat } = chats.find(chat =>
        [message.receiver_id, message.senderId].includes(chat.receiverId),
      )

      if (chatIsTaken.has(chat.id)) return
      chatIsTaken.add(chat.id)

      const contact = contactsMap.get(message.receiver_id) ?? null

      const item = {
        contact: contact
          ? {
              id: contact.id,
              alias: contact.alias,
            }
          : null,
        latestMsg: {
          id: message.id,
          status: message.status,
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
        receiver: {
          id: message.receiver_id,
          dp: message.receiver_dp,
          username: message.receiver_username,
          globalName: message.receiver_global_name,
        },
        chat,
      }

      if (item.chat.archived) res.archived.push(item)
      else res.unarchived.push(item)
    })

    return res
  }

  async clearChat(authUserId: User['id'], receiverId: User['id']): Promise<void> {
    await this.chatRepository.updateChatOptions(authUserId, receiverId, { firstMsgTstamp: new Date() })
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
