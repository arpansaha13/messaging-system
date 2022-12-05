import { Injectable } from '@nestjs/common'
// Services
import { RoomService } from '../rooms/room.service'
import { UserService } from '../users/user.service'
import { MessageService } from 'src/rooms/messages.service'
import { ContactService } from '../contacts/contact.service'
// Models
import type { ChatListItemModel } from 'src/chat-list/chat-list.model'

@Injectable()
export class ChatListService {
  constructor(
    private readonly userService: UserService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly contactService: ContactService,
  ) {}

  /** Get the list of chats for a particular user. This will be displayed on the sidebar */
  async getChatListOfUser(authUserId: number): Promise<ChatListItemModel[]> {
    const chatList: ChatListItemModel[] = []

    const chatEntities = await this.roomService.getAllChatEntitiesOfUser(authUserId)
    await this.messageService.updateDeliveredStatus(authUserId, chatEntities)

    if (chatEntities.length === 0) return chatList

    const promises: Promise<void>[] = []

    for (const chatEntity of chatEntities) {
      promises.push(
        new Promise<void>(async resolve => {
          const receiverId =
            chatEntity.participant_1 === authUserId ? chatEntity.participant_2 : chatEntity.participant_1

          const [latestMsg, user, contact] = await Promise.all([
            this.messageService.getLatestMsgByChatId(chatEntity.id, chatEntity.firstMsgTstamp[authUserId]),
            this.userService.getUser(receiverId),
            this.contactService.getContactEntity(authUserId, receiverId),
          ])
          let chatListItem: ChatListItemModel = {
            userId: receiverId,
            dp: user.dp,
            alias: contact !== null ? contact.alias : null,
            bio: user.bio,
            muted: chatEntity.isMuted[receiverId],
            time: null,
            status: null,
            latestMsgContent: null,
          }
          // `latestMsg` may be `null` if no message is found
          if (latestMsg !== null) {
            chatListItem = {
              ...chatListItem,
              time: latestMsg.createdAt,
              status: latestMsg.senderId === authUserId ? latestMsg.status : null,
              latestMsgContent: latestMsg.content,
            }
          }

          chatList.push(chatListItem)
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
