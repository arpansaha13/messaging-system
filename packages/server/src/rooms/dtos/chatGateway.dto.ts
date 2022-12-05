import { IsBoolean, IsNumber, IsString } from 'class-validator'

export class Ws1to1MessageDto {
  /** The message that was received. */
  @IsString()
  msg: string

  /** Time at which the message was sent. */
  @IsNumber()
  ISOtime: string

  /** Id of the user who sent the message. */
  @IsNumber()
  senderId: number

  /** Id of the user who is supposed to receive the message. */
  @IsNumber()
  receiverId: number
}

export class WsTypingStateDto {
  @IsBoolean()
  isTyping: boolean

  /** Id of the user who is typing a message (sender). */
  @IsNumber()
  senderId: number

  /** Id of the user for whom the message is being typed (receiver). */
  @IsNumber()
  receiverId: number
}
