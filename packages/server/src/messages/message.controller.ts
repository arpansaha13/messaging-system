import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { MessageService } from './message.service'
import { MessageIdParamDto } from './dto/MessageIdParam.dto'

import type { MessageEntity } from './message.entity'

@Controller('messages')
@UseGuards(AuthGuard())
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Get('/:messageId')
  getMessageById(@Param() params: MessageIdParamDto): Promise<MessageEntity> {
    return this.messageService.getMessageById(params.messageId)
  }
}
