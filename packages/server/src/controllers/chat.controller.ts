import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Service
import { ChatService } from 'src/services/chat.service'
// Custom Decorator
import { GetPayload } from 'src/auth/getPayload.decorator'
// DTOs
import { GetChatParams } from 'src/dtos/chat.dto'
// Types
import type { UserEntity } from 'src/entities/user.entity'
import type { MessageEntity } from 'src/entities/message.entity'

@Controller('chats')
@UseGuards(AuthGuard())
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get the chat between two users.
   * @param params user tag of the other user with whom the chat is.
   * @param userEntity Authorized user entity.
   */
  @Get('/:user_id')
  async getChat(
    @Param() params: GetChatParams,
    @GetPayload('user') userEntity: UserEntity,
  ): Promise<MessageEntity[]> {
    return this.chatService.getChat(userEntity.id, params.user_id)
  }
}
