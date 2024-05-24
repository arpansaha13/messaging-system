import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ChatsService } from './chats.service'
import type { Request } from 'express'

@UseGuards(AuthGuard())
@Controller('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get()
  getChats(@Req() request: Request) {
    return this.chatService.getChats(request.user.id)
  }
}
