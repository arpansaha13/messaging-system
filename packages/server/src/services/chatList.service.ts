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
  async getChatListOfUser(userTag: string): Promise<ChatListItemModel[]> {
    const chatList: ChatListItemModel[] = []

    const chats = await this.chatService.getAllChatsOfUser(userTag)
    if (chats.length === 0) return chatList

    const promises: Promise<void>[] = []

    for (const chat of chats) {
      promises.push(
        new Promise<void>(async (resolve) => {
          const [latestMsg, user, contact] = await Promise.all([
            this.chatService.getLatestMsgByChatId(chat.chatId),
            this.userService.getUser(chat.userTag2),
            this.contactService.getContactEntity(chat.userTag1, chat.userTag2),
          ])
          chatList.push({
            userTag: chat.userTag2,
            dp: user.dp,
            alias: contact !== null ? contact.alias : null,
            time: latestMsg.time,
            muted: chat.muted,
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
