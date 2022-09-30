import { Controller, Get, Param } from '@nestjs/common'
import { ChatsService } from 'src/services/chats.service'
// Types
import { MessageType } from 'src/types'

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('/:userTag')
  getChat(@Param('userTag') userTag: string): MessageType[] {
    return this.chatsService.getChat(userTag)
  }
}
