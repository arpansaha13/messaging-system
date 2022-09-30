import { Controller, Get } from '@nestjs/common'
import { ChatListService } from 'src/services/chatList.service'
// Types
import { ChatListItemType } from 'src/types'

@Controller('chat-list')
export class ChatListController {
  constructor(private readonly chatListService: ChatListService) {}

  @Get()
  getChatList(): ChatListItemType[] {
    return this.chatListService.getChatList()
  }
}
