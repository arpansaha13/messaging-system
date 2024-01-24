import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { MessageService } from './message.service'

import type { Message } from './message.entity'

@Controller('messages')
@UseGuards(AuthGuard())
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Get('/:messageId')
  getMessageById(@Param('messageId') messageId: number): Promise<Message> {
    return this.messageService.getMessageById(messageId)
  }
}
