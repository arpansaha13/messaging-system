import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Services
import { ChatService } from 'src/chats/chat.service'
import { MessageService } from './messages.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// DTOs
import { GetChatParamsDto } from 'src/chats/dtos/chat.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'
import type { MessageEntity } from './message.entity'

@Controller('chats')
@UseGuards(AuthGuard())
export class ChatController {
  constructor(private readonly chatService: ChatService, private readonly messageService: MessageService) {}

  /**
   * Get the chat between two users.
   * @param params user tag of the other user with whom the chat is.
   * @param userEntity Authorized user entity.
   */
  @Get('/:userId')
  async getChat(
    @Param() params: GetChatParamsDto,
    @GetPayload('user') userEntity: UserEntity,
  ): Promise<MessageEntity[]> {
    const chatEntity = await this.chatService.getChatEntityByUserIds(userEntity.id, params.userId)
    return this.messageService.getMessagesByChatId(chatEntity.id)
  }

  // @Get('/clear/:userId')
  // async clearChat(
  //   @Param() params: GetChatParamsDto,
  //   @GetPayload('user') userEntity: UserEntity,
  // ): Promise<MessageEntity[]> {
  //   return this.chatService.clearChat(userEntity.id, params.userId)
  // }
}
