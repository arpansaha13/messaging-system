import { Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ChatsService } from './chats.service'
import { ChatIdParam } from './dtos/chat-id-param.dto'
import type { Request } from 'express'

@UseGuards(AuthGuard())
@Controller('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get()
  getChats(@Req() request: Request) {
    return this.chatService.getChats(request.user.id)
  }

  @Patch('/:receiverId/archive')
  archiveRoom(@Req() request: Request, @Param() params: ChatIdParam): Promise<void> {
    return this.chatService.updateArchive(request.user.id, params.receiverId, true)
  }

  @Patch('/:receiverId/unarchive')
  unarchiveRoom(@Req() request: Request, @Param() params: ChatIdParam): Promise<void> {
    return this.chatService.updateArchive(request.user.id, params.receiverId, false)
  }

  @Patch('/:receiverId/pin')
  pinChat(@Req() request: Request, @Param() params: ChatIdParam): Promise<void> {
    return this.chatService.updatePin(request.user.id, params.receiverId, true)
  }

  @Patch('/:receiverId/unpin')
  unpinChat(@Req() request: Request, @Param() params: ChatIdParam): Promise<void> {
    return this.chatService.updatePin(request.user.id, params.receiverId, false)
  }

  @Delete('/:receiverId/clear')
  clearChat(@Req() request: Request, @Param() params: ChatIdParam): Promise<void> {
    return this.chatService.clearChat(request.user.id, params.receiverId)
  }

  @Delete('/:receiverId/delete')
  deleteChat(@Req() request: Request, @Param() params: ChatIdParam): Promise<void> {
    return this.chatService.deleteChat(request.user.id, params.receiverId)
  }
}
