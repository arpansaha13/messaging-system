import { Injectable } from '@nestjs/common'
// Services
import { ChatService } from '../chats/chat.service'
import { UserService } from '../users/user.service'
import { MessageService } from 'src/chats/messages.service'
import { ContactService } from '../contacts/contact.service'
// Models
import type { ChatListItemModel } from 'src/chat-list/chat-list.model'

@Injectable()
export class ChatListService {
  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly contactService: ContactService,
  ) {}

  /** Get the list of chats for a particular user. This will be displayed on the sidebar */
  async getChatListOfUser(authUserId: number): Promise<ChatListItemModel[]> {
    const chatList: ChatListItemModel[] = []

    const chatEntities = await this.chatService.getAllChatEntitiesOfUser(authUserId)
    await this.messageService.updateDeliveredStatus(authUserId, chatEntities)

    if (chatEntities.length === 0) return chatList

    const promises: Promise<void>[] = []

    for (const chatEntity of chatEntities) {
      promises.push(
        new Promise<void>(async resolve => {
          const receiverId =
            chatEntity.participant_1 === authUserId ? chatEntity.participant_2 : chatEntity.participant_1

          const [latestMsg, user, contact] = await Promise.all([
            this.messageService.getLatestMsgByChatId(chatEntity.id),
            this.userService.getUser(receiverId),
            this.contactService.getContactEntity(authUserId, receiverId),
          ])

          chatList.push({
            userId: receiverId,
            dp: user.dp,
            alias: contact !== null ? contact.alias : null,
            bio: user.bio,
            time: latestMsg.createdAt,
            muted: chatEntity.isMuted[receiverId],
            status: latestMsg.senderId === authUserId ? latestMsg.status : null,
            latestMsg: latestMsg.content,
          })
          resolve()
        }),
      )
    }
    await Promise.all(promises)

    // This sort does not work properly.
    // FIXME: Update this service such that sorting is done with query.
    return chatList.sort((a, b) => {
      if (a.time < b.time) return -1
      if (a.time > b.time) return 1
      return 0
    })
  }
}
