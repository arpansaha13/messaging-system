import { Type } from 'class-transformer'
import { IsNumber, IsString } from 'class-validator'

export class WsChatEventDto {
  /** The message that was received. */
  @Type(() => String)
  @IsString()
  msg: string

  /** Id of the user who sent the message. */
  @Type(() => Number)
  @IsNumber()
  senderId: number

  /** Id of the user who is supposed to receive the message. */
  @Type(() => Number)
  @IsNumber()
  receiverId: number
}
