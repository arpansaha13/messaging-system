import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Service
import { ChatListService } from 'src/chat-list/chatList.service'
// Models
import type { ChatListItemModel } from 'src/chat-list/chat-list.model'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('chat-list')
@UseGuards(AuthGuard())
export class ChatListController {
  constructor(private readonly chatListService: ChatListService) {}

  @Get()
  getChatListOfUser(
    @GetPayload('user') userEntity: UserEntity,
  ): Promise<ChatListItemModel[]> {
    return this.chatListService.getChatListOfUser(userEntity.id)
  }
}
