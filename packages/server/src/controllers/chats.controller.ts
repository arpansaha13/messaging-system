import { Controller, Get, Param } from '@nestjs/common'
import { ChatsService } from 'src/services/chats.service'
// Models
import type { MessageModel } from 'src/models/message.model'

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('/:userTag')
  getChatbyUserTag(@Param('userTag') userTag: string): MessageModel[] {
    return this.chatsService.getChatbyUserTag(userTag)
  }
}
