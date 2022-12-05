import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Services
import { MessageService } from './messages.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// DTOs
import { GetLatestMsgParamsDto } from './dto/GetLatestMsgParams.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'
import type { MessageEntity } from './message.entity'

@Controller('messages')
@UseGuards(AuthGuard())
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('/latest/:roomId')
  async getLatestMsgOfRoom(
    @GetPayload('user') authUser: UserEntity,
    @Param() params: GetLatestMsgParamsDto,
  ): Promise<MessageEntity> {
    return this.messageService.getLatestMsgByRoomId(authUser.id, params.roomId)
  }
}
