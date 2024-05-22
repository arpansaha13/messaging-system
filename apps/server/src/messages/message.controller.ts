import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { MessageService } from './message.service'
import { RoomIdParam } from 'src/rooms/dto/room-id-param.dto'
import type { Request } from 'express'
import type { Message } from './message.entity'

@Controller('messages')
@UseGuards(AuthGuard())
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get('/:roomId')
  async getMessagesByRoomId(@Req() request: Request, @Param() params: RoomIdParam): Promise<Message[]> {
    return this.messageService.getMessagesByRoomId(request.user, params.roomId)
  }
}
