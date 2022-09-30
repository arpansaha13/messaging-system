import { Controller, Get } from '@nestjs/common'
import { ChatListService } from 'src/services/chatList.service'
// Models
import type { ChatListItemModel } from 'src/models/chat-list.model'

@Controller('chat-list')
export class ChatListController {
  constructor(private readonly chatListService: ChatListService) {}

  @Get()
  getChatList(): ChatListItemModel[] {
    return this.chatListService.getChatList()
  }
}
