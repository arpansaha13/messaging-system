import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ChatService } from 'src/services/chat.service'
// Entity
import { MessageEntity } from 'src/entities/message.entity'
// Validation
import { IsDefined, validate } from 'class-validator'

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getChat(
    @Query('userTag1') userTag1: string,
    @Query('userTag2') userTag2: string,
  ): Promise<MessageEntity[]> {
    class QueryValidationDto {
      constructor(tag1: string, tag2: string) {
        this.userTag1 = tag1
        this.userTag2 = tag2
      }
      @IsDefined() userTag1: string
      @IsDefined() userTag2: string
    }
    const queries = new QueryValidationDto(userTag1, userTag2)
    const errors = await validate(queries)
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.map((err) => err.constraints.isDefined),
      )
    }
    return this.chatService.getChat(userTag1, userTag2)
  }
}
