import { Injectable } from '@nestjs/common'
// Services
import { ChatService } from './chat.service'
import { UserService } from './user.service'
import { ContactService } from './contact.service'
// Models
import type { ChatListItemModel } from 'src/models/chat-list.model'

@Injectable()
export class ChatListService {
  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly contactService: ContactService,
  ) {}

  /** Get the list of chats for a particular user. This will be displayed on the sidebar */
  async getChatListOfUser(user_id: number): Promise<ChatListItemModel[]> {
    const chatList: ChatListItemModel[] = []

    const chats = await this.chatService.getAllChatsOfUser(user_id)
    if (chats.length === 0) return chatList

    const promises: Promise<void>[] = []

    for (const chat of chats) {
      promises.push(
        new Promise<void>(async resolve => {
          const [latestMsg, user, contact] = await Promise.all([
            this.chatService.getLatestMsgByChatId(chat.id),
            this.userService.getUser(chat.sec_person),
            this.contactService.getContactEntity(chat.user, chat.sec_person),
          ])
          chatList.push({
            user_id: chat.user,
            dp: user.dp,
            alias: contact !== null ? contact.alias : null,
            time: latestMsg.created_at,
            muted: chat.is_muted,
            status: latestMsg.status,
            latestMsg: latestMsg.message,
          })
          resolve()
        }),
      )
    }
    await Promise.all(promises)

    return chatList.sort((a, b) => {
      if (a.time < b.time) return -1
      if (a.time > b.time) return 1
      return 0
    })
  }
}
