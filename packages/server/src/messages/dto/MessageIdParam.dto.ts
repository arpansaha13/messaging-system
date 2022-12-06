import { IsNotEmpty, IsNumber } from 'class-validator'

export class MessageIdParamDto {
  @IsNotEmpty()
  @IsNumber()
  messageId: number
}
