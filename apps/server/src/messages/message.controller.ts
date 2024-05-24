import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { MessageService } from './message.service'
import { UserIdParam } from './dtos/user-id-param.dto'
import type { Request } from 'express'
import type { Message } from './message.entity'

@Controller('messages')
@UseGuards(AuthGuard())
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get('/:userId')
  async getMessagesByUserId(@Req() request: Request, @Param() params: UserIdParam): Promise<Message[]> {
    return this.messageService.getMessagesByUserId(request.user, params.userId)
  }
}
