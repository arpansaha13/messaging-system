import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ChatsService } from './chats.service'
import { UserIdParam } from './dtos/user-id-param.dto'
import type { Request } from 'express'
import type { IChatListItem } from '@shared/types'
import type { IChatsResponse } from './interfaces/chats-response.interface'

@UseGuards(AuthGuard())
@Controller('chats')
export class ChatsController {
  constructor(private chatService: ChatsService) {}

  @Get()
  getChatsOfUser(@Req() request: Request): Promise<IChatsResponse> {
    return this.chatService.getChatsOfUser(request.user.id)
  }

  @Get('/:receiverId')
  getChatOfUserWithReceiver(@Req() request: Request, @Param() params: UserIdParam): Promise<IChatListItem> {
    return this.chatService.getChatOfUserWithReceiver(request.user.id, params.receiverId)
  }

  @Patch('/:receiverId/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveRoom(@Req() request: Request, @Param() params: UserIdParam): Promise<void> {
    return this.chatService.updateArchive(request.user.id, params.receiverId, true)
  }

  @Patch('/:receiverId/unarchive')
  @HttpCode(HttpStatus.NO_CONTENT)
  unarchiveRoom(@Req() request: Request, @Param() params: UserIdParam): Promise<void> {
    return this.chatService.updateArchive(request.user.id, params.receiverId, false)
  }

  @Patch('/:receiverId/pin')
  @HttpCode(HttpStatus.NO_CONTENT)
  pinChat(@Req() request: Request, @Param() params: UserIdParam): Promise<void> {
    return this.chatService.updatePin(request.user.id, params.receiverId, true)
  }

  @Patch('/:receiverId/unpin')
  @HttpCode(HttpStatus.NO_CONTENT)
  unpinChat(@Req() request: Request, @Param() params: UserIdParam): Promise<void> {
    return this.chatService.updatePin(request.user.id, params.receiverId, false)
  }

  @Delete('/:receiverId/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearChat(@Req() request: Request, @Param() params: UserIdParam): Promise<void> {
    return this.chatService.clearChat(request.user.id, params.receiverId)
  }

  @Delete('/:receiverId/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChat(@Req() request: Request, @Param() params: UserIdParam): Promise<void> {
    return this.chatService.deleteChat(request.user.id, params.receiverId)
  }
}
