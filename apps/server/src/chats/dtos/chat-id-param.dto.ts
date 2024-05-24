import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import type { Chat } from '../chats.entity'

export class ChatIdParam {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  receiverId: Chat['id']
}
