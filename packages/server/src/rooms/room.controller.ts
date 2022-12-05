import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Services
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from './messages.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// DTOs
import { GetChatParamsDto } from 'src/rooms/dtos/chat.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'
import type { MessageEntity } from '../messages/message.entity'

@Controller('chats')
@UseGuards(AuthGuard())
export class ChatController {
  constructor(private readonly roomService: RoomService, private readonly messageService: MessageService) {}

  /**
   * Get the chat between two users.
   * @param params user tag of the other user with whom the chat is.
   * @param userEntity Authorized user entity.
   */
  @Get('/:userId')
  async getChatMessages(
    @Param() params: GetChatParamsDto,
    @GetPayload('user') userEntity: UserEntity,
  ): Promise<MessageEntity[]> {
    const chatEntity = await this.roomService.getChatEntityByUserIds(userEntity.id, params.userId)
    const firstMsgTstamp = chatEntity.firstMsgTstamp[userEntity.id]
    return this.messageService.getMessagesByChatId(chatEntity.id, firstMsgTstamp)
  }

  @Get('/clear/:userId')
  clearChat(@Param() params: GetChatParamsDto, @GetPayload('user') userEntity: UserEntity): Promise<void> {
    return this.roomService.clearChat(userEntity.id, params.userId)
  }
}
